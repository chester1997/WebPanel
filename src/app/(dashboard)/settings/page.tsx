import { requireUser, requireTenant, assertRole } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { revalidatePath } from "next/cache"

async function updateSettingsAction(formData: FormData) {
  "use server"
  const user = await requireUser()
  const { tenant, role } = await requireTenant(user.id)
  assertRole(role, "MANAGER")

  const storeName = formData.get("storeName")?.toString()
  const primaryColor = formData.get("primaryColor")?.toString()
  const secondaryColor = formData.get("secondaryColor")?.toString()

  const existing = await db.orm.public.MiniAppSettings.first({ tenantId: tenant.id })
  
  if (existing) {
    await db.orm.public.MiniAppSettings.where({ id: existing.id }).update({
      storeName: storeName || undefined,
      primaryColor: primaryColor || undefined,
      secondaryColor: secondaryColor || undefined,
    })
  } else {
    await db.orm.public.MiniAppSettings.create({
      tenantId: tenant.id,
      slug: tenant.slug, // fallback para o proprio tenant caso crie nas configs gerais
      storeName: storeName || tenant.name,
      primaryColor: primaryColor || "#18181b",
      secondaryColor: secondaryColor || "#09090b",
    })
  }

  // Se o nome da loja mudou, também atualizar o nome do tenant
  if (storeName && storeName !== tenant.name && role === "OWNER") {
    await db.orm.public.Tenant.where({ id: tenant.id }).update({ name: storeName })
  }

  revalidatePath("/settings")
  revalidatePath(`/store/${tenant.slug}`)
}

export default async function SettingsPage() {
  const user = await requireUser()
  const { tenant, role } = await requireTenant(user.id)
  
  const settings = await db.orm.public.MiniAppSettings.first({ tenantId: tenant.id })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configurações da Loja</h2>
          <p className="text-zinc-400">Personalize a identidade visual e dados do seu Mini App.</p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Aparência do Mini App</CardTitle>
            <CardDescription className="text-zinc-400">Estas configurações definem como seus clientes visualizam a loja no Telegram.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateSettingsAction} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-300">Nome Público da Loja</label>
                <Input 
                  name="storeName" 
                  defaultValue={settings?.storeName || tenant.name} 
                  className="bg-zinc-950 border-zinc-800 text-white mt-1" 
                  disabled={role !== "OWNER" && role !== "MANAGER"}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300">Cor Primária (Header)</label>
                  <div className="flex gap-2 mt-1">
                    <Input 
                      type="color" 
                      name="primaryColor" 
                      defaultValue={settings?.primaryColor || "#18181b"} 
                      className="w-12 h-10 p-1 bg-zinc-950 border-zinc-800 rounded cursor-pointer" 
                    />
                    <Input 
                      type="text" 
                      defaultValue={settings?.primaryColor || "#18181b"} 
                      className="bg-zinc-950 border-zinc-800 text-white flex-1 font-mono" 
                      readOnly
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">Cor Fundo (Background)</label>
                  <div className="flex gap-2 mt-1">
                    <Input 
                      type="color" 
                      name="secondaryColor" 
                      defaultValue={settings?.secondaryColor || "#09090b"} 
                      className="w-12 h-10 p-1 bg-zinc-950 border-zinc-800 rounded cursor-pointer" 
                    />
                    <Input 
                      type="text" 
                      defaultValue={settings?.secondaryColor || "#09090b"} 
                      className="bg-zinc-950 border-zinc-800 text-white flex-1 font-mono" 
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full mt-2" disabled={role !== "OWNER" && role !== "MANAGER"}>
                Salvar Configurações
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
