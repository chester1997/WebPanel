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

    // Nenhuma conta de tenant reconheceu o pagamento — pode ser uma cobrança
    // de assinatura da própria plataforma (o vendedor pagando a Webi/
    // WebPanel), gerada com a conta Mercado Pago da plataforma.
    let isPlatformPayment = false;
    if (!payment) {
      const platformToken = process.env.MERCADOPAGO_PLATFORM_ACCESS_TOKEN;
      if (platformToken) {
        const found = await fetchPaymentWithConnection(paymentId, platformToken);
        if (found?.external_reference?.startsWith("platform_sub:")) {
          payment = found;
          isPlatformPayment = true;
        }
      }
    }

    if (!payment || !payment.external_reference) {
      // Nenhuma conta reconhece este pagamento — não há tenant real para
      // persistir com segurança (WebhookEvent exige um).
      return NextResponse.json({ received: true, status: "unmatched" });
    }

    if (isPlatformPayment) {
      const platformPaymentId = payment.external_reference.slice("platform_sub:".length);
      const platformPayment = await db.orm.public.PlatformPayment.first({ id: platformPaymentId });
      if (!platformPayment) {
        return NextResponse.json({ received: true, status: "platform_payment_not_found" });
      }

      tenantId = platformPayment.tenantId;
      const newStatus =
        payment.status === "approved"
          ? "APPROVED"
          : payment.status === "rejected"
            ? "REJECTED"
            : "PENDING";

      await db.orm.public.PlatformPayment.where({ id: platformPayment.id }).update({
        externalId: String(payment.id),
        status: newStatus,
      });

      if (newStatus === "APPROVED") {
        const existingSub = await db.orm.public.PlatformSubscription.first({ tenantId });
        const base =
          existingSub && new Date(existingSub.expiresAt).getTime() > Date.now()
            ? new Date(existingSub.expiresAt)
            : new Date();
        const expiresAt = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);

        if (existingSub) {
          await db.orm.public.PlatformSubscription.where({ id: existingSub.id }).update({
            planId: platformPayment.planId,
            status: "ACTIVE",
            expiresAt,
            renewalAt: expiresAt,
          });
        } else {
          await db.orm.public.PlatformSubscription.create({
            tenantId,
            planId: platformPayment.planId,
            status: "ACTIVE",
            expiresAt,
            renewalAt: expiresAt,
          });
        }
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
          payload: { paymentId: payment.id, status: payment.status, kind: "platform_subscription" },
          processed: true,
          processedAt: new Date(),
        });
      }

      return NextResponse.json({ success: true });
    }

    if (!tenantId) {
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
