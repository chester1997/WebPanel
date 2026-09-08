"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, requireTenant, assertRole } from "@/lib/auth/session";
import { encryptSecret } from "@/lib/security/crypto";

export async function connectMercadoPagoManual(formData: FormData) {
  const user = await requireUser();
  const { tenant, role } = await requireTenant(user.id);
  assertRole(role, "MANAGER");

  const accessToken = formData.get("accessToken")?.toString().trim();
  if (!accessToken) return { error: "Token é obrigatório" };

  try {
    const check = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!check.ok) {
      return { error: "Access Token inválido ou sem permissão" };
    }

    const existing = await db.orm.public.PaymentGatewayConnection.first({
      tenantId: tenant.id,
      gateway: "MERCADO_PAGO",
    });

    if (existing) {
      await db.orm.public.PaymentGatewayConnection.where({
        id: existing.id,
      }).update({
        accessToken: encryptSecret(accessToken),
        isActive: true,
      });
    } else {
      await db.orm.public.PaymentGatewayConnection.create({
        tenantId: tenant.id,
        gateway: "MERCADO_PAGO",
        accessToken: encryptSecret(accessToken),
        isActive: true,
      });
    }

    revalidatePath("/finance");
    return { success: true };
  } catch {
    return { error: "Erro ao conectar Mercado Pago" };
  }
}

export async function disconnectMercadoPago() {
  const user = await requireUser();
  const { tenant, role } = await requireTenant(user.id);
  assertRole(role, "MANAGER");

  const existing = await db.orm.public.PaymentGatewayConnection.first({
    tenantId: tenant.id,
    gateway: "MERCADO_PAGO",
  });

  if (existing) {
    await db.orm.public.PaymentGatewayConnection.where({
      id: existing.id,
    }).update({ isActive: false });
  }

  revalidatePath("/finance");
  return { success: true };
}
