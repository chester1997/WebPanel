import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/security/crypto";

const TELEGRAM_API_URL = "https://api.telegram.org";

/**
 * Grants access to every product in a paid order and notifies the customer
 * via the tenant's bot. Idempotent: re-running for an order that already
 * granted access just leaves it ACTIVE and re-sends the delivery message
 * (safe to call again from a retried/duplicate webhook).
 */
export async function grantAccessAndNotify(orderId: string) {
  try {
    const order = await db.orm.public.Order.first({ id: orderId });
    if (!order || order.status !== "PAID") {
      return { error: "Pedido inválido ou não pago." };
    }

    const [customer, items, bot] = await Promise.all([
      db.orm.public.Customer.first({ id: order.customerId }),
      db.orm.public.OrderItem.where({ orderId: order.id }).all(),
      db.orm.public.Bot.first({ tenantId: order.tenantId }),
    ]);

    if (!customer || items.length === 0) {
      return { error: "Pedido sem cliente ou itens." };
    }

    const productIds = items.map((i) => i.productId);
    const products = await db.orm.public.Product.where((p) =>
      p.id.in(productIds)
    ).all();
    const productById = new Map(products.map((p) => [p.id, p]));

    for (const item of items) {
      const existing = await db.orm.public.CustomerAccess.first({
        customerId: order.customerId,
        productId: item.productId,
      });

      if (existing) {
        if (existing.status !== "ACTIVE") {
          await db.orm.public.CustomerAccess.where({ id: existing.id }).update({
            status: "ACTIVE",
          });
        }
      } else {
        await db.orm.public.CustomerAccess.create({
          customerId: order.customerId,
          productId: item.productId,
          status: "ACTIVE",
        });
      }
    }

    await db.orm.public.Customer.where({ id: customer.id }).update({
      totalSpent: customer.totalSpent + order.totalAmount,
    });

    if (bot && bot.status === "ACTIVE" && customer.telegramId) {
      const botToken = decryptSecret(bot.botToken);
      const productNames = items
        .map((item) => productById.get(item.productId)?.title)
        .filter(Boolean)
        .join(", ");

      let deliveryMessage = `Seu pagamento foi aprovado!\n\nVocê adquiriu: ${productNames}\n`;

      const firstProduct = productById.get(items[0].productId);
      if (firstProduct?.deliveryType === "EXTERNAL_LINK" && firstProduct.deliveryContent) {
        deliveryMessage += `\nAcesse seu conteúdo aqui: ${firstProduct.deliveryContent}`;
      } else if (
        (firstProduct?.deliveryType === "TELEGRAM_GROUP" ||
          firstProduct?.deliveryType === "TELEGRAM_CHANNEL") &&
        firstProduct.deliveryContent
      ) {
        deliveryMessage += `\nEntre aqui: ${firstProduct.deliveryContent}`;
      } else {
        deliveryMessage += `\nAbra a Mini App para acessar seu conteúdo!`;
      }

      await fetch(`${TELEGRAM_API_URL}/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: customer.telegramId,
          text: deliveryMessage,
        }),
      });
    }

    return { success: true };
  } catch (error) {
    console.error("[Delivery Service Error]", error);
    return { error: "Erro ao processar entrega." };
  }
}
