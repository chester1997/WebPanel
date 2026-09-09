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

      const tenant = await db.orm.public.Tenant.first({ id: bot.tenantId });
      const settings = await db.orm.public.MiniAppSettings.first({ botId: bot.id });
      
      if (tenant) {
        const appUrl = process.env.APP_URL || "https://web-panel-5gpgznu9c-luizs-projects-0434a0fd.vercel.app";
        const miniAppUrl = settings ? `${appUrl}/store/${settings.slug}` : `${appUrl}/store/${tenant.slug}`;

        // Enviar mensagem de boas-vindas com o link do Mini App via Telegram Bot API.
        // O token deve vir desencriptado (mockamos isso buscando direto ou como env, 
        // mas idealmente voc deve descriptografar bot.botToken. Aqui por simplicidade 
        // vamos manter o placeholder ou se for um setup real, precisa da chave de decrypt).
        // No momento bot.botToken foi encriptado em actions.js. Vamos assumir que h uma lib de decrypt.
        // Para n quebrar, vou usar a bot API chamando com um token placeholder se n der match, 
        // mas o Webhook n precisa de webhook URL se no souber o token.
        // TODO: Importante: Adicionar um `process.env.TELEGRAM_BOT_TOKEN` se todos usam um mock,
        // ou descriptografar `bot.botToken`.
        // Como o token original n est visvel (criptografado), s podemos usar ele se soubermos a chave.
        
        // Em WebPanel (actions), usamos `encryptSecret`. 
        // Vamos usar a funo correspondente `decryptSecret` para usar o token.
        
        const { decryptSecret } = await import("@/lib/security/crypto");
        const realToken = decryptSecret(bot.botToken);

        await fetch(`https://api.telegram.org/bot${realToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: body.message.chat.id,
            text: `Olá, ${telegramUser.first_name}! Bem-vindo(a) à nossa loja. Clique no botão abaixo para abrir o catálogo.`,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: settings?.buttonText || "Abrir Loja",
                    web_app: {
                      url: miniAppUrl
                    }
                  }
                ]
              ]
            }
          })
        }).catch(err => console.error("Failed to send telegram message:", err));
      }
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
