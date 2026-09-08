"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, requireTenant, assertRole } from "@/lib/auth/session";

export async function createContent(formData: FormData) {
  const user = await requireUser();
  const { tenant, role } = await requireTenant(user.id);
  assertRole(role, "MANAGER");

  const title = formData.get("title")?.toString().trim();
  const type = formData.get("type")?.toString() || "MOVIE";

  if (!title) return { error: "Título é obrigatório" };

  try {
    await db.orm.public.Content.create({
      tenantId: tenant.id,
      title,
      type,
      status: "ACTIVE",
    });
    revalidatePath("/contents");
    return { success: true };
  } catch {
    return { error: "Erro ao criar conteúdo" };
  }
}
