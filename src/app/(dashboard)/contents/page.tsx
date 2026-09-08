import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AppWindow, Video, ListVideo } from "lucide-react"

const getTenantId = () => "cl_fake_tenant_id" 

export default async function ContentsPage() {
  const tenantId = getTenantId()
  
  const contents = await db.content.findMany({
    where: { tenantId },
    include: { seasons: { include: { episodes: true } } },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Conteúdos Digitais</h2>
          <p className="text-zinc-400">Gerencie Filmes, Séries e Cursos que os clientes acessam na Mini App.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
          Novo Conteúdo
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contents.length === 0 && (
          <div className="col-span-full py-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/50">
            <AppWindow className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-zinc-300">Nenhum conteúdo cadastrado</h3>
            <p className="text-zinc-500 text-sm mb-4">Cadastre seu primeiro vídeo ou série.</p>
            <Button variant="outline" className="border-zinc-700 text-zinc-300">Criar Conteúdo</Button>
          </div>
        )}
        
        {contents.map(content => (
          <Card key={content.id} className="bg-zinc-900 border-zinc-800 flex flex-col">
            <div className="h-32 bg-zinc-800 rounded-t-xl" /> {/* Placeholder Cover */}
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base leading-tight flex items-center gap-2">
                {content.type === "SERIES" ? <ListVideo className="w-4 h-4 text-blue-500" /> : <Video className="w-4 h-4 text-amber-500" />}
                {content.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="mt-auto">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                <span className="bg-zinc-800 px-2 py-1 rounded">{content.type}</span>
                {content.type === "SERIES" && (
                  <span>{content.seasons.length} Temp. / {content.seasons.reduce((acc, s) => acc + s.episodes.length, 0)} Eps.</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
