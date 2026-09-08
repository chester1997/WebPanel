"use server";

import { db } from "@/lib/db";

/**
 * Creates a pending order for a customer, pricing the item from the database
 * (never trusting a price supplied by the caller) and opening a matching
 * PENDING payment row. Intended to be called from the Mini App checkout flow
 * once a customer session (validated Telegram initData) is available — not a
 * Server Action bound directly to an unauthenticated form.
 */
export async function createOrder(
  tenantId: string,
  customerId: string,
  productId: string
) {
  try {
    const product = await db.orm.public.Product.first({
      id: productId,
      tenantId,
    });
    if (!product) {
      return { error: "Produto indisponível" };
    }

    const price = await db.orm.public.ProductPrice.first({
      productId: product.id,
      isActive: true,
    });
    if (!price) {
      return { error: "Produto sem preço configurado" };
    }

    const amount = price.promotionalPrice ?? price.price;

    const order = await db.orm.public.Order.create({
      tenantId,
      customerId,
      totalAmount: amount,
      currency: price.currency,
      status: "PENDING",
    });

    await db.orm.public.OrderItem.create({
      orderId: order.id,
      productId: product.id,
      quantity: 1,
      price: amount,
    });

    await db.orm.public.Payment.create({
      tenantId,
      orderId: order.id,
      gateway: "MERCADO_PAGO",
      amount,
      status: "PENDING",
    });

    return { success: true, order };
  } catch {
    return { error: "Erro ao criar pedido" };
  }
}
