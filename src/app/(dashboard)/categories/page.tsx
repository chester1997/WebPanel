import { requireUser, requireTenant } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { CategoryForm } from "./category-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Folder } from "lucide-react"

export default async function CategoriesPage() {
  const user = await requireUser()
  const { tenant } = await requireTenant(user.id)

  const categories = await db.orm.public.Category.where({ tenantId: tenant.id }).all()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Categorias</h2>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <CategoryForm />
        </div>

        <div className="md:col-span-2">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Minhas Categorias</CardTitle>
              <CardDescription className="text-zinc-400">Organização das prateleiras na loja.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categories.length === 0 && (
                  <div className="text-center py-8 text-zinc-500 text-sm">
                    Nenhuma categoria criada.
                  </div>
                )}
                {categories.map(cat => (
                  <div key={cat.id} className="p-3 border border-zinc-800 rounded-lg flex items-center gap-3 bg-zinc-950">
                    <Folder className="w-5 h-5 text-blue-500" />
                    <div>
                      <h4 className="text-white font-medium text-sm">{cat.name}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">/{cat.slug}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
