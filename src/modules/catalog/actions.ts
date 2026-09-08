"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

// Simulando obtenção do tenant atual pelo auth.js
const getTenantId = () => "cl_fake_tenant_id" 

export async function createCategory(formData: FormData) {
  const tenantId = getTenantId()
  const name = formData.get("name")?.toString()
  const slug = formData.get("slug")?.toString() || name?.toLowerCase().replace(/\\s+/g, '-')

  if (!name || !slug) return { error: "Nome é obrigatório" }

  try {
    await db.category.create({
      data: { tenantId, name, slug }
    })
    revalidatePath("/categories")
    return { success: true }
  } catch (e) {
    return { error: "Erro ao criar categoria" }
  }
}

export async function createProduct(formData: FormData) {
  const tenantId = getTenantId()
  const title = formData.get("title")?.toString()
  const priceStr = formData.get("price")?.toString()
  const type = formData.get("type")?.toString() || "DIGITAL"
  const deliveryType = formData.get("deliveryType")?.toString() || "EXTERNAL_LINK"
  
  if (!title || !priceStr) return { error: "Campos obrigatórios faltando" }

  try {
    const slug = title.toLowerCase().replace(/\\s+/g, '-')
    const price = parseFloat(priceStr)

    const product = await db.product.create({
      data: {
        tenantId,
        title,
        slug,
        type,
        deliveryType,
        prices: {
          create: { price }
        }
      }
    })

    revalidatePath("/products")
    return { success: true, product }
  } catch (e) {
    return { error: "Erro ao criar produto" }
  }
}
