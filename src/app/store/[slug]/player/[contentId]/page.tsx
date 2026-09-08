import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { ChevronLeft, Play, Maximize2 } from "lucide-react"

export default async function PlayerMiniApp({ params }: { params: { slug: string, contentId: string } }) {
  const { slug, contentId } = params

  const tenant = await db.tenant.findUnique({ where: { slug } })
  if (!tenant) return notFound()

  // 1. Validar se o cliente tem acesso a esse contentId (mockado aqui)
  // 2. Buscar dados da Media / Content
  
  // Vamos criar um Player visual mockado que a instrução pediu.
  
  return (
    <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
      
      {/* Top Navbar overlay no player */}
      <div className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
        <Link href={`/store/${slug}/meus-acessos`} className="p-2 bg-black/40 rounded-full backdrop-blur-md">
          <ChevronLeft className="w-5 h-5 text-white" />
        </Link>
        <span className="text-xs font-medium text-zinc-300">Episódio 1</span>
        <div className="w-9" /> {/* Spacer for alignment */}
      </div>

      {/* Video Area */}
      <div className="relative flex-1 bg-zinc-900 flex items-center justify-center">
        {/* Placeholder for real video element */}
        <div className="text-center space-y-3">
          <button className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto hover:scale-105 transition-transform shadow-lg shadow-blue-600/30">
            <Play className="w-6 h-6 text-white ml-1" />
          </button>
          <p className="text-sm font-medium text-zinc-400">Conteúdo Protegido (DRM)</p>
        </div>

        {/* Fake Video Controls */}
        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 to-transparent flex items-center gap-3">
          <button><Play className="w-4 h-4" /></button>
          <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
            <div className="w-1/3 h-full bg-blue-500 rounded-full" />
          </div>
          <span className="text-[10px] font-mono">12:04 / 45:00</span>
          <button><Maximize2 className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Info Area */}
      <div className="h-1/3 min-h-[250px] bg-zinc-950 p-5 overflow-y-auto">
        <h1 className="text-xl font-bold mb-1">A Ascensão do SaaS</h1>
        <p className="text-xs text-emerald-500 font-medium mb-4">98% Relevante · 2026</p>
        
        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
          Neste episódio, descubra como plataformas multi-tenant isoladas revolucionaram o mercado digital permitindo que milhares de vendedores operassem pelo Telegram.
        </p>

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Próximos Episódios</h3>
          {/* Mock Lista de episodios */}
          {[2, 3].map(ep => (
             <div key={ep} className="flex gap-3 items-center opacity-70">
               <div className="w-24 h-16 bg-zinc-800 rounded-md shrink-0 flex items-center justify-center">
                 <Play className="w-4 h-4 text-zinc-600" />
               </div>
               <div>
                 <h4 className="text-sm font-medium">Episódio {ep}</h4>
                 <p className="text-xs text-zinc-500">45 min</p>
               </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  )
}
