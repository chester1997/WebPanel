import { requireUser, requireTenant } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { NewContentForm } from "./new-content-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PlayCircle } from "lucide-react"

export default async function ContentsPage() {
  const user = await requireUser()
  const { tenant } = await requireTenant(user.id)
  
  const contents = await db.orm.public.Content.where({ tenantId: tenant.id }).all()
  const products = await db.orm.public.Product.where({ tenantId: tenant.id }).all()

  // Mapear produtos
  const productsMap = new Map()
  for (const p of products) productsMap.set(p.id, p)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Conteúdos (Filmes/Séries)</h2>
          <p className="text-zinc-400">Gerencie os vídeos vinculados aos produtos que você vende.</p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <NewContentForm />
        </div>
        
        <div className="md:col-span-2">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Meus Conteúdos</CardTitle>
              <CardDescription className="text-zinc-400">Vídeos disponíveis no player integrado da sua loja.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contents.length === 0 && (
                  <div className="text-center py-8 text-zinc-500 text-sm">
                    Nenhum conteúdo cadastrado.
                  </div>
                )}
                {contents.map(c => (
                  <div key={c.id} className="p-4 border border-zinc-800 rounded-lg flex gap-4 bg-zinc-950 items-start">
                    <div className="w-24 h-16 bg-zinc-800 rounded flex flex-col items-center justify-center shrink-0">
                      <PlayCircle className="w-6 h-6 text-zinc-600 mb-1" />
                      <span className="text-[10px] text-zinc-500 uppercase">{c.type}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{c.title}</h4>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{c.description}</p>
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
