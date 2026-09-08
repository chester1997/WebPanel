"use server"

import { prisma } from "@/lib/prisma"
import { validateBotToken, setWebhook } from "@/modules/telegram/telegram-service"
import { revalidatePath } from "next/cache"
// Na prática usaríamos a sessão aqui (auth.js). 
// Para este momento da Fase 2, vamos usar um tenant fixo do mock.

// Funções criptográficas (Exemplo - Em produção usar lib real com a AUTH_SECRET)
function encryptSecret(text: string) {
  // TODO: Implementar AES encryption real usando crypto
  return Buffer.from(text).toString('base64')
}

export async function connectBotAction(formData: FormData) {
  const token = formData.get("token")?.toString()
  const tenantId = formData.get("tenantId")?.toString() || "cl_fake_tenant_id" // Substituir por Auth

  if (!token) return { error: "Token é obrigatório" }

  try {
    // 1. Validar no Telegram
    const validation = await validateBotToken(token)
    if (!validation.success || !validation.bot) {
      return { error: validation.error || "Token inválido" }
    }

    // Como é SaaS, talvez o tenant já tenha bot ou não
    // Pegar o bot atual ou criar novo
    let bot = await prisma.bot.findFirst({ where: { tenantId } })

    if (!bot) {
      bot = await prisma.bot.create({
        data: {
          tenantId,
          botToken: encryptSecret(token),
          username: validation.bot.username,
          name: validation.bot.first_name,
        }
      })
    } else {
      bot = await prisma.bot.update({
        where: { id: bot.id },
        data: {
          botToken: encryptSecret(token),
          username: validation.bot.username,
          name: validation.bot.first_name,
        }
      })
    }

    // 2. Configurar Webhook
    const webhookResult = await setWebhook(token, bot.id)

    if (webhookResult.success) {
      await prisma.telegramWebhook.upsert({
        where: { botId: bot.id },
        update: { isActive: true },
        create: {
          botId: bot.id,
          url: "CONFIGURADO",
          secret: "SECRET_GERADO", // Implementar geração de secret de validação
          isActive: true
        }
      })
      revalidatePath("/bots")
      return { success: true, bot: validation.bot }
    } else {
      return { error: `Erro no Webhook: ${webhookResult.error}` }
    }
  } catch (err) {
    return { error: "Ocorreu um erro inesperado ao conectar o bot." }
  }
}
