import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  try {
    const { botId } = params
    const body = await request.json()

    console.log(`[Webhook Telegram] Bot ${botId} recebeu evento:`, body)

    // 1. Validar se o bot existe e está ativo
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      include: { tenant: true }
    })

    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 })
    }

    // 2. Armazenar o evento para idempotência (WebhookEvent)
    const updateId = body.update_id?.toString()
    if (updateId) {
      const existingEvent = await prisma.webhookEvent.findUnique({
        where: { provider_eventId: { provider: "TELEGRAM", eventId: updateId } }
      })

      if (existingEvent) {
        // Já processado
        return NextResponse.json({ received: true, status: "already_processed" })
      }

      await prisma.webhookEvent.create({
        data: {
          tenantId: bot.tenantId,
          provider: "TELEGRAM",
          eventId: updateId,
          payload: body,
          processed: true, // Em um cenário real, só marcar como true após processar
          processedAt: new Date()
        }
      })
    }

    // 3. Processar /start
    if (body.message?.text?.startsWith("/start")) {
      // Registrar cliente inicial (mesmo antes da compra se necessário, ou enviar link do Mini App)
      const telegramUser = body.message.from
      
      await prisma.customer.upsert({
        where: { tenantId_telegramId: { tenantId: bot.tenantId, telegramId: telegramUser.id.toString() } },
        update: {
          name: telegramUser.first_name,
          telegramUsername: telegramUser.username,
        },
        create: {
          tenantId: bot.tenantId,
          telegramId: telegramUser.id.toString(),
          name: telegramUser.first_name,
          telegramUsername: telegramUser.username,
          status: "ACTIVE"
        }
      })
      
      // TODO: Enviar mensagem de boas vindas com botão para o Web App (Mini App) via fetch pro Telegram
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Webhook Telegram] Erro:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
