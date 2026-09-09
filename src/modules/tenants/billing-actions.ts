"use server";

import { db } from "@/lib/db";
import { requireUser, requireTenant, assertRole } from "@/lib/auth/session";
import { createMPPreference } from "@/modules/payments/mercadopago";

/**
 * Gera uma cobrança PIX (Checkout Pro do Mercado Pago) para o vendedor pagar
 * a própria assinatura da plataforma. Usa a conta Mercado Pago da
 * plataforma (MERCADOPAGO_PLATFORM_ACCESS_TOKEN) — nunca a conta do tenant,
 * que é usada para receber os pagamentos dos clientes dele, não para pagar
 * a Webi/WebPanel.
 */
export async function createPlatformCheckoutAction(planId: string) {
  const user = await requireUser();
  const { tenant, role } = await requireTenant(user.id);
  assertRole(role, "OWNER");

  const platformToken = process.env.MERCADOPAGO_PLATFORM_ACCESS_TOKEN;
  if (!platformToken) {
    return { error: "Pagamento de assinatura ainda não configurado pela plataforma." };
  }

  const plan = await db.orm.public.Plan.first({ id: planId, isActive: true });
  if (!plan) return { error: "Plano não encontrado." };

  const platformPayment = await db.orm.public.PlatformPayment.create({
    tenantId: tenant.id,
    planId: plan.id,
    amount: plan.price,
    status: "PENDING",
  });

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const preference = await createMPPreference(platformToken, {
    id: `platform_sub:${platformPayment.id}`,
    title: `Assinatura WebPanel — Plano ${plan.name}`,
    price: plan.price,
    webhookUrl: `${appUrl}/api/webhooks/mercadopago`,
  });

  if (!preference.success || !preference.init_point) {
    return { error: "Erro ao gerar cobrança PIX. Tente novamente." };
  }

  await db.orm.public.PlatformPayment.where({ id: platformPayment.id }).update({
    paymentUrl: preference.init_point as string,
  });

  return { success: true, checkoutUrl: preference.init_point as string };
}
