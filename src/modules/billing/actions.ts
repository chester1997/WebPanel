"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, requireTenant, assertRole } from "@/lib/auth/session";

export async function updateBillingReminderSettingsAction(formData: FormData) {
  const user = await requireUser();
  const { tenant, role } = await requireTenant(user.id);
  assertRole(role, "MANAGER");

  const data = {
    pixReminderActive: formData.get("pixReminderActive") === "on",
    pixMsg5: formData.get("pixMsg5")?.toString().trim() ?? "",
    pixMsg7: formData.get("pixMsg7")?.toString().trim() ?? "",
    pixMsg10: formData.get("pixMsg10")?.toString().trim() ?? "",
    planReminderActive: formData.get("planReminderActive") === "on",
    planMsg3d: formData.get("planMsg3d")?.toString().trim() ?? "",
    planMsg1d: formData.get("planMsg1d")?.toString().trim() ?? "",
    planMsgExpired: formData.get("planMsgExpired")?.toString().trim() ?? "",
  };

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string" && value.length === 0) {
      return { error: `Preencha todas as mensagens (campo "${key}" está vazio).` };
    }
  }

  const existing = await db.orm.public.BillingReminderSettings.first({ tenantId: tenant.id });

  if (existing) {
    await db.orm.public.BillingReminderSettings.where({ id: existing.id }).update(data);
  } else {
    await db.orm.public.BillingReminderSettings.create({ tenantId: tenant.id, ...data });
  }

  revalidatePath("/cobranca");
  return { success: true };
}
