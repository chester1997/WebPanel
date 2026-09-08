"use server"

import { db } from "@/lib/db"

export async function createOrder(tenantId: string, customerId: string, productId: string) {
  try {
    const product = await db.product.findUnique({
      where: { id: productId },
      include: { prices: true }
    })

    if (!product || !product.prices[0]) {
      return { error: "Produto indisponível" }
    }

    const price = product.prices[0].price

    const order = await db.order.create({
      data: {
        tenantId,
        customerId,
        totalAmount: price,
        status: "PENDING",
        items: {
          create: {
            productId: product.id,
            price: price,
            quantity: 1
          }
        }
      }
    })

    return { success: true, order }
  } catch (error) {
    return { error: "Erro ao criar pedido" }
  }
}
