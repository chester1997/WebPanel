"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, requireTenant, assertRole } from "@/lib/auth/session";
import { encryptSecret, generateWebhookSecret } from "@/lib/security/crypto";
import { validateBotToken, setWebhook } from "@/modules/telegram/telegram-service";

export async function connectBotAction(formData: FormData) {
  const user = await requireUser();
  const { tenant, role } = await requireTenant(user.id);
  assertRole(role, "MANAGER");

  const token = formData.get("token")?.toString().trim();
  if (!token) return { error: "Token é obrigatório" };

  try {
    const validation = await validateBotToken(token);
    if (!validation.success || !validation.bot) {
      return { error: validation.error || "Token inválido" };
    }

    const existing = await db.orm.public.Bot.first({ tenantId: tenant.id });

    const bot = existing
      ? await db.orm.public.Bot.where({ id: existing.id }).update({
          botToken: encryptSecret(token),
          username: validation.bot.username,
          name: validation.bot.first_name,
          status: "ACTIVE",
        })
      : await db.orm.public.Bot.create({
          tenantId: tenant.id,
          botToken: encryptSecret(token),
          username: validation.bot.username,
          name: validation.bot.first_name,
          status: "ACTIVE",
        });

    if (!bot) {
      return { error: "Não foi possível salvar o bot." };
    }

    const webhookResult = await setWebhook(token, bot.id);

    if (!webhookResult.success) {
      return { error: `Erro ao configurar webhook: ${webhookResult.error ?? webhookResult.description}` };
    }

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const webhookUrl = `${appUrl}/api/webhooks/telegram/${bot.id}`;
    const existingWebhook = await db.orm.public.TelegramWebhook.first({
      botId: bot.id,
    });

    if (existingWebhook) {
      await db.orm.public.TelegramWebhook.where({
        id: existingWebhook.id,
      }).update({ url: webhookUrl, isActive: true });
    } else {
      await db.orm.public.TelegramWebhook.create({
        botId: bot.id,
        url: webhookUrl,
        secret: generateWebhookSecret(),
        isActive: true,
      });
    }

    revalidatePath("/bots");
    return { success: true, bot: validation.bot };
  } catch {
    return { error: "Ocorreu um erro inesperado ao conectar o bot." };
  }
}

export async function removeBotAction(botId: string) {
  const user = await requireUser();
  const { tenant, role } = await requireTenant(user.id);
  assertRole(role, "MANAGER");

  const bot = await db.orm.public.Bot.first({ id: botId, tenantId: tenant.id });
  if (!bot) return { error: "Bot não encontrado" };

  await db.orm.public.Bot.where({ id: bot.id }).delete();
  revalidatePath("/bots");
  return { success: true };
}
