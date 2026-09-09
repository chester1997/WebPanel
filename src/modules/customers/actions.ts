"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, requireTenant, assertRole } from "@/lib/auth/session";

export async function setCustomerBanStatus(customerId: string, banned: boolean) {
  const user = await requireUser();
  const { tenant, role } = await requireTenant(user.id);
  assertRole(role, "MANAGER");

  const customer = await db.orm.public.Customer.first({ id: customerId, tenantId: tenant.id });
  if (!customer) return { error: "Cliente não encontrado" };

  await db.orm.public.Customer.where({ id: customer.id }).update({
    status: banned ? "BANNED" : "ACTIVE",
  });

  revalidatePath("/customers");
  return { success: true };
}
