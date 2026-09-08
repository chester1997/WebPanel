import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const { botId } = await params;
    const body = await request.json();

    const bot = await db.orm.public.Bot.first({ id: botId });
    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    const webhook = await db.orm.public.TelegramWebhook.first({ botId });
    const secretHeader = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (!webhook || !webhook.isActive || secretHeader !== webhook.secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updateId = body.update_id?.toString();
    if (updateId) {
      const existingEvent = await db.orm.public.WebhookEvent.first({
        provider: "TELEGRAM",
        eventId: updateId,
      });

      if (existingEvent) {
        return NextResponse.json({ received: true, status: "already_processed" });
      }

      await db.orm.public.WebhookEvent.create({
        tenantId: bot.tenantId,
        provider: "TELEGRAM",
        eventId: updateId,
        payload: body,
        processed: false,
      });
    }

    if (body.message?.text?.startsWith("/start")) {
      const telegramUser = body.message.from;
      const telegramId = telegramUser.id.toString();

      const existingCustomer = await db.orm.public.Customer.first({
        tenantId: bot.tenantId,
        telegramId,
      });

      if (existingCustomer) {
        await db.orm.public.Customer.where({ id: existingCustomer.id }).update({
          name: telegramUser.first_name,
          telegramUsername: telegramUser.username,
        });
      } else {
        await db.orm.public.Customer.create({
          tenantId: bot.tenantId,
          telegramId,
          name: telegramUser.first_name,
          telegramUsername: telegramUser.username,
          status: "ACTIVE",
        });
      }

      // TODO: enviar mensagem de boas-vindas com o link do Mini App via Telegram Bot API.
    }

    if (updateId) {
      await db.orm.public.WebhookEvent.where({
        provider: "TELEGRAM",
        eventId: updateId,
      }).update({ processed: true, processedAt: new Date() });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook Telegram] Erro:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
