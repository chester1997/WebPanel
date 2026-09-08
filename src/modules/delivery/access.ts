import { db } from "@/lib/db"

const TELEGRAM_API_URL = "https://api.telegram.org"

export async function grantAccessAndNotify(orderId: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        tenant: { include: { bots: true } },
        items: { include: { product: true } }
      }
    })

    if (!order || order.status !== "PAID") return { error: "Pedido inválido ou não pago." }

    const product = order.items[0]?.product
    if (!product) return { error: "Produto não encontrado." }

    // 1. Criar Customer Access
    await db.customerAccess.upsert({
      where: { id: "access_" + order.id }, // Simplificação pro mock
      update: { status: "ACTIVE" },
      create: {
        customerId: order.customerId,
        productId: product.id,
        status: "ACTIVE",
        grantedAt: new Date()
      }
    })

    // 2. Notificar o cliente via Telegram Bot
    const bot = order.tenant.bots[0]
    if (bot && bot.status === "ACTIVE" && order.customer.telegramId) {
      
      let deliveryMessage = `🎉 Seu pagamento foi aprovado!\\n\\nVocê acabou de adquirir: **${product.title}**\\n`
      
      if (product.deliveryType === "EXTERNAL_LINK") {
        deliveryMessage += `\\nAcesse seu conteúdo aqui: ${product.deliveryContent}`
      } else if (product.deliveryType === "TELEGRAM_GROUP") {
        deliveryMessage += `\\nEntre no grupo exclusivo: ${product.deliveryContent}`
      } else {
        deliveryMessage += `\\nAbra a Mini App para acessar seu conteúdo!`
      }

      await fetch(`${TELEGRAM_API_URL}/bot${bot.botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: order.customer.telegramId,
          text: deliveryMessage,
          parse_mode: "Markdown"
        })
      })
    }

    return { success: true }
  } catch (error) {
    console.error("[Delivery Service Error]", error)
    return { error: "Erro ao processar entrega." }
  }
}
