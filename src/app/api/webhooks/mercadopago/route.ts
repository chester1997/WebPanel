import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/security/crypto";
import { grantAccessAndNotify } from "@/modules/delivery/access";

interface MpPayment {
  id: number;
  status: string; // approved, pending, rejected, refunded...
  external_reference: string | null;
}

async function fetchPaymentWithConnection(
  paymentId: string,
  accessToken: string
): Promise<MpPayment | null> {
  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) return null;
  return response.json();
}

function mapMpStatusToOrderStatus(status: string): string {
  switch (status) {
    case "approved":
      return "PAID";
    case "refunded":
    case "charged_back":
      return "REFUNDED";
    case "cancelled":
      return "CANCELLED";
    case "rejected":
      return "FAILED";
    default:
      return "PENDING";
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const topic = url.searchParams.get("topic") || url.searchParams.get("type");
    const paymentId =
      url.searchParams.get("id") || url.searchParams.get("data.id");

    if (!paymentId || topic !== "payment") {
      return NextResponse.json({ received: true });
    }

    const existingEvent = await db.orm.public.WebhookEvent.first({
      provider: "MERCADO_PAGO",
      eventId: paymentId,
    });
    if (existingEvent?.processed) {
      return NextResponse.json({ received: true, status: "already_processed" });
    }

    // Endpoint compartilhado por toda a plataforma (não há callback por
    // tenant): tentamos o token de cada conta conectada até uma reconhecer o
    // pagamento. O pagamento é sempre revalidado diretamente na API do
    // Mercado Pago — nunca confiamos apenas no payload do webhook.
    const connections = await db.orm.public.PaymentGatewayConnection.where({
      gateway: "MERCADO_PAGO",
      isActive: true,
    }).all();

    let payment: MpPayment | null = null;
    let tenantId: string | null = null;

    for (const connection of connections) {
      const accessToken = decryptSecret(connection.accessToken);
      const found = await fetchPaymentWithConnection(paymentId, accessToken);
      if (found) {
        payment = found;
        tenantId = connection.tenantId;
        break;
      }
    }

    if (!payment || !tenantId || !payment.external_reference) {
      // Nenhuma conta conectada reconhece este pagamento — não há tenant
      // real para persistir com segurança (WebhookEvent exige um).
      return NextResponse.json({ received: true, status: "unmatched" });
    }

    const order = await db.orm.public.Order.first({
      id: payment.external_reference,
      tenantId,
    });
    if (!order) {
      return NextResponse.json({ received: true, status: "order_not_found" });
    }

    const orderStatus = mapMpStatusToOrderStatus(payment.status);

    await db.orm.public.Order.where({ id: order.id }).update({
      status: orderStatus,
    });

    const paymentRow = await db.orm.public.Payment.first({ orderId: order.id });
    if (paymentRow) {
      await db.orm.public.Payment.where({ id: paymentRow.id }).update({
        externalId: String(payment.id),
        status:
          payment.status === "approved" ? "APPROVED" : payment.status.toUpperCase(),
      });
    }

    if (orderStatus === "PAID") {
      await grantAccessAndNotify(order.id);
    }

    if (existingEvent) {
      await db.orm.public.WebhookEvent.where({ id: existingEvent.id }).update({
        processed: true,
        processedAt: new Date(),
      });
    } else {
      await db.orm.public.WebhookEvent.create({
        tenantId,
        provider: "MERCADO_PAGO",
        eventId: paymentId,
        payload: { paymentId: payment.id, status: payment.status },
        processed: true,
        processedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Webhook MP Error]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
