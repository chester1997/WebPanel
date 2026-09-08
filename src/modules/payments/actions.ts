"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

const getTenantId = () => "cl_fake_tenant_id" 

// Exemplo: Função criptográfica de mock
function encryptSecret(text: string) { return Buffer.from(text).toString('base64') }

export async function connectMercadoPagoManual(formData: FormData) {
  const tenantId = getTenantId()
  const accessToken = formData.get("accessToken")?.toString()

  if (!accessToken) return { error: "Token é obrigatório" }

  try {
    // Simular validação básica batendo numa rota dummy do MP (ex: /users/me)
    const check = await fetch("https://api.mercadopago.com/users/me", {
      headers: { "Authorization": `Bearer ${accessToken}` }
    })

    if (!check.ok) {
      return { error: "Access Token inválido ou sem permissão" }
    }

    await db.paymentGatewayConnection.upsert({
      where: { tenantId_gateway: { tenantId, gateway: "MERCADO_PAGO" } },
      update: { accessToken: encryptSecret(accessToken), isActive: true },
      create: {
        tenantId,
        gateway: "MERCADO_PAGO",
        accessToken: encryptSecret(accessToken),
        isActive: true
      }
    })

    revalidatePath("/finance")
    return { success: true }
  } catch (error) {
    return { error: "Erro ao conectar Mercado Pago" }
  }
}
