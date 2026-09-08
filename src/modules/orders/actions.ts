"use server"

import { db } from "@/lib/db"

export async function createOrder(tenantId: string, customerId: string, productId: string) {
  try {
    const product = await db.orm.public.Product.first({ id: productId })
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
  } catch (error) {
    return { error: "Erro ao criar pedido" }
  }
}
