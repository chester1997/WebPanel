"use server"

import { db } from "@/lib/db"
import { decryptSecret } from "@/lib/security/crypto"
import { getStoreCustomer } from "@/lib/telegram/customer-session"
import { getCart, saveCart } from "@/lib/store/cart"
import { createMPPreference } from "@/modules/payments/mercadopago"

export async function createOrder(tenantId: string, customerId: string, productId: string) {
  try {
    const product = await db.orm.public.Product.first({ id: productId, tenantId })
    if (!product) return { error: "Produto indisponível" }

    const priceRecord = await db.orm.public.ProductPrice.first({ productId })
    if (!priceRecord) return { error: "Preço não configurado para o produto" }

    const price = priceRecord.price

    const order = await db.orm.public.Order.create({
      tenantId,
      customerId,
      totalAmount: price,
      currency: "BRL",
      status: "PENDING"
    })

    await db.orm.public.OrderItem.create({
      orderId: order.id,
      productId: product.id,
      quantity: 1,
      price
    })

    return { success: true, order }
  } catch {
    return { error: "Erro ao criar pedido" }
  }
}

/**
 * Finaliza o carrinho do cliente (identificado pela sessão de Mini App
 * validada via initData) em um pedido real: preços vêm sempre do banco,
 * nunca do carrinho do cliente. Cria Order + OrderItem(s) + Payment
 * PENDING e, se a loja já tiver o Mercado Pago conectado, gera uma
 * preferência de pagamento real (PIX/cartão) e retorna o link de checkout.
 */
export async function checkoutCart(slug: string) {
  const tenant = await db.orm.public.Tenant.first({ slug, status: "ACTIVE" })
  if (!tenant) return { error: "Loja não encontrada" }

  const customer = await getStoreCustomer(slug, tenant.id)
  if (!customer) {
    return { error: "Abra esta loja pelo Mini App do Telegram para finalizar a compra." }
  }

  const cart = await getCart(slug)
  if (cart.length === 0) return { error: "Seu carrinho está vazio." }

  try {
    const productIds = cart.map((i) => i.productId)
    const products = await db.orm.public.Product.where((p) => p.id.in(productIds)).all()
    const productById = new Map(products.map((p) => [p.id, p]))

    const prices = await db.orm.public.ProductPrice.where((p) =>
      p.productId.in(productIds)
    ).all()
    const priceByProduct = new Map<string, number>()
    for (const price of prices) {
      if (!priceByProduct.has(price.productId)) {
        priceByProduct.set(price.productId, price.promotionalPrice ?? price.price)
      }
    }

    let totalAmount = 0
    const lineItems: { productId: string; quantity: number; price: number; title: string }[] = []

    for (const item of cart) {
      const product = productById.get(item.productId)
      if (!product || product.tenantId !== tenant.id || product.status !== "ACTIVE") continue
      const unitPrice = priceByProduct.get(item.productId)
      if (unitPrice === undefined) continue
      totalAmount += unitPrice * item.quantity
      lineItems.push({ productId: item.productId, quantity: item.quantity, price: unitPrice, title: product.title })
    }

    if (lineItems.length === 0) {
      return { error: "Os produtos do carrinho não estão mais disponíveis." }
    }

    const order = await db.orm.public.Order.create({
      tenantId: tenant.id,
      customerId: customer.id,
      totalAmount,
      currency: "BRL",
      status: "PENDING",
    })

    for (const item of lineItems) {
      await db.orm.public.OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })
    }

    await db.orm.public.Payment.create({
      tenantId: tenant.id,
      orderId: order.id,
      gateway: "MERCADO_PAGO",
      amount: totalAmount,
      status: "PENDING",
    })

    await saveCart(slug, [])

    const connection = await db.orm.public.PaymentGatewayConnection.first({
      tenantId: tenant.id,
      gateway: "MERCADO_PAGO",
      isActive: true,
    })

    if (connection) {
      const appUrl = process.env.APP_URL || "http://localhost:3000"
      const accessToken = decryptSecret(connection.accessToken)
      const preference = await createMPPreference(accessToken, {
        id: order.id,
        title: lineItems.map((i) => i.title).join(", ").slice(0, 250),
        price: totalAmount,
        webhookUrl: `${appUrl}/api/webhooks/mercadopago`,
      })

      if (preference.success && preference.init_point) {
        return { success: true, orderId: order.id, checkoutUrl: preference.init_point as string }
      }
    }

    return { success: true, orderId: order.id, checkoutUrl: null }
  } catch (error) {
    console.error("[checkoutCart]", error)
    return { error: "Erro ao finalizar o pedido." }
  }
}
