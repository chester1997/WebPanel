"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, requireTenant, assertRole } from "@/lib/auth/session";
import { encryptSecret, generateWebhookSecret } from "@/lib/security/crypto";
import { validateBotToken, setWebhook, setChatMenuButton } from "@/modules/telegram/telegram-service";

export async function connectBotAction(formData: FormData) {
  const user = await requireUser();
  const { tenant, role } = await requireTenant(user.id);
  assertRole(role, "MANAGER");

  const token = formData.get("token")?.toString().trim();
  const displayName = formData.get("displayName")?.toString().trim();
  const primaryColor = formData.get("primaryColor")?.toString().trim() || "#f97316";
  const buttonText = formData.get("buttonText")?.toString().trim() || "Abrir Loja";
  
  if (!token) return { error: "Token é obrigatório" };

  try {
    const validation = await validateBotToken(token);
    if (!validation.success) {
      return { error: validation.error || "Token inválido" };
    }
    if (!validation.bot) {
      return { error: "Token inválido" };
    }

    const botIdStr = validation.bot.id.toString();

    const existing = await db.orm.public.Bot.first({ telegramBotId: botIdStr });

    const bot = existing
      ? await db.orm.public.Bot.where({ id: existing.id }).update({
          tenantId: tenant.id,
          botToken: encryptSecret(token),
          telegramBotId: botIdStr,
          username: validation.bot.username,
          name: validation.bot.first_name,
          status: "ACTIVE",
        })
      : await db.orm.public.Bot.create({
          tenantId: tenant.id,
          botToken: encryptSecret(token),
          telegramBotId: botIdStr,
          username: validation.bot.username,
          name: validation.bot.first_name,
          status: "ACTIVE",
        });

    if (!bot) {
      return { error: "Não foi possível salvar o bot." };
    }

    // Criar ou atualizar MiniAppSettings para este bot
    const existingSettings = await db.orm.public.MiniAppSettings.first({ botId: bot.id });
    const slug = validation.bot.username.toLowerCase();

    if (!existingSettings) {
      await db.orm.public.MiniAppSettings.create({
        tenantId: tenant.id,
        botId: bot.id,
        slug,
        storeName: displayName || validation.bot.first_name,
        primaryColor,
        buttonText,
      });
    } else {
      await db.orm.public.MiniAppSettings.where({ id: existingSettings.id }).update({
        slug,
        storeName: displayName || existingSettings.storeName,
        primaryColor,
        buttonText,
      });
    }

    const existingWebhook = await db.orm.public.TelegramWebhook.first({ botId: bot.id });
    const webhookSecret = existingWebhook?.secret ?? generateWebhookSecret();
    const webhookResult = await setWebhook(token, bot.id, webhookSecret);

    if (!webhookResult.success) {
      return { error: `Erro ao configurar webhook: ${webhookResult.error}` };
    }

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const webhookUrl = `${appUrl}/api/webhooks/telegram/${bot.id}`;
    const miniAppUrl = `${appUrl}/store/${slug}`;

    if (existingWebhook) {
      await db.orm.public.TelegramWebhook.where({ id: existingWebhook.id }).update({ url: webhookUrl, isActive: true });
    } else {
      await db.orm.public.TelegramWebhook.create({ botId: bot.id, url: webhookUrl, secret: webhookSecret, isActive: true });
    }

    // Configura o Menu Button do Telegram para abrir o Mini App
    await setChatMenuButton(token, miniAppUrl, buttonText);

    revalidatePath("/bots");
    return { success: true, bot: validation.bot };
  } catch (error) {
    console.error(error);
    return { error: "Ocorreu um erro inesperado ao conectar o bot." };
  }
}

export async function removeBotAction(botId: string) {
  const user = await requireUser();
  const { tenant, role } = await requireTenant(user.id);
  assertRole(role, "MANAGER");

  const bot = await db.orm.public.Bot.first({ id: botId, tenantId: tenant.id });
  if (!bot) return { error: "Bot não encontrado" };

  await db.orm.public.Bot.where({ id: bot.id }).update({ status: "DISABLED" });
  revalidatePath("/bots");
  return { success: true };
}
