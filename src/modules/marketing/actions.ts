"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, requireTenant, assertRole } from "@/lib/auth/session";

export async function createCoupon(formData: FormData) {
  const user = await requireUser();
  const { tenant, role } = await requireTenant(user.id);
  assertRole(role, "MANAGER");

  const code = formData.get("code")?.toString().trim().toUpperCase();
  const type = formData.get("type")?.toString() || "PERCENTAGE";
  const valueStr = formData.get("value")?.toString();

  if (!code || !valueStr) return { error: "Código e valor são obrigatórios" };
  const value = parseFloat(valueStr);
  if (Number.isNaN(value) || value <= 0) return { error: "Valor inválido" };

  const existing = await db.orm.public.Coupon.first({ tenantId: tenant.id, code });
  if (existing) return { error: "Já existe um cupom com este código" };

  try {
    await db.orm.public.Coupon.create({
      tenantId: tenant.id,
      code,
      type,
      value,
      isActive: true,
    });
    revalidatePath("/marketing");
    return { success: true };
  } catch {
    return { error: "Erro ao criar cupom" };
  }
}
