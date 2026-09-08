"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, requireTenant } from "@/lib/auth/session";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function createCategory(formData: FormData) {
  const user = await requireUser();
  const { tenant } = await requireTenant(user.id);

  const name = formData.get("name")?.toString().trim();
  if (!name) return { error: "Nome é obrigatório" };
  const slug = slugify(name);

  try {
    await db.orm.public.Category.create({
      tenantId: tenant.id,
      name,
      slug,
    });
    revalidatePath("/categories");
    return { success: true };
  } catch {
    return { error: "Erro ao criar categoria" };
  }
}

export async function createProduct(formData: FormData) {
  const user = await requireUser();
  const { tenant } = await requireTenant(user.id);

  const title = formData.get("title")?.toString().trim();
  const priceStr = formData.get("price")?.toString();
  const type = formData.get("type")?.toString() || "DIGITAL";
  const categoryId = formData.get("categoryId")?.toString() || null;

  if (!title || !priceStr) return { error: "Campos obrigatórios faltando" };

  const price = parseFloat(priceStr);
  if (Number.isNaN(price) || price < 0) {
    return { error: "Preço inválido" };
  }

  try {
    const slug = slugify(title);

    const product = await db.orm.public.Product.create({
      tenantId: tenant.id,
      categoryId: categoryId || null,
      title,
      slug,
      type,
      deliveryType: "EXTERNAL_LINK",
      status: "ACTIVE",
    });

    await db.orm.public.ProductPrice.create({
      productId: product.id,
      price,
    });

    revalidatePath("/products");
    return { success: true, product };
  } catch {
    return { error: "Erro ao criar produto" };
  }
}
