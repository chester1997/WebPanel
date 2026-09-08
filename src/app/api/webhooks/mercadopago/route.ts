import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const topic = url.searchParams.get("topic") || url.searchParams.get("type")
    const id = url.searchParams.get("id") || url.searchParams.get("data.id")

    if (!id || topic !== "payment") {
      return NextResponse.json({ received: true })
    }

    console.log(`[Webhook MP] Recebeu pagamento: ID ${id}`)

    // Num ambiente real, precisamos buscar as informações do pagamento na API do MP
    // usando o Access Token do Tenant correto para validar o status e o OrderId.
    // Aqui faremos a estrutura básica do fluxo idempotente:

    const existingEvent = await db.webhookEvent.findUnique({
      where: { provider_eventId: { provider: "MERCADO_PAGO", eventId: id } }
    })

    if (existingEvent) {
      return NextResponse.json({ received: true, status: "already_processed" })
    }

    // Criamos evento PENDENTE de processamento (ou já processado)
    // O Tenant ID precisaria ser inferido pelo MP external_reference (order.tenantId)
    // Para simplificação de Phase 4 mockamos:
    const tenantId = "cl_fake_tenant_id"

    await db.webhookEvent.create({
      data: {
        tenantId,
        provider: "MERCADO_PAGO",
        eventId: id,
        payload: { rawUrl: request.url },
        processed: true,
        processedAt: new Date()
      }
    })

    // TODO: 
    // 1. Fetch MP API `/v1/payments/${id}`
    // 2. Extrair `external_reference` (orderId) e `status`
    // 3. Update Order { status: "PAID" }
    // 4. Se PAID, criar `CustomerAccess` para o cliente
    // 5. Enviar Notificação via Telegram Bot (Notification Service)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[Webhook MP Error]", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
