import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { PlayCircle, Lock } from "lucide-react"

export default async function MyAccessesMiniApp({ params }: { params: { slug: string } }) {
  const { slug } = params

  const tenant = await db.tenant.findUnique({
    where: { slug },
    include: { miniAppSettings: true }
  })

  if (!tenant) return notFound()

  // MOCK: Obter Customer ID logado através do initData do Telegram
  const fakeCustomerId = "cl_fake_customer_id" 
  
  const accesses = await db.customerAccess.findMany({
    where: { customerId: fakeCustomerId, status: "ACTIVE" },
    include: { product: { include: { category: true } } }
  })

  const settings = tenant.miniAppSettings

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col"
         style={{ backgroundColor: settings?.secondaryColor || "#09090b" }}>
      
      <header className="sticky top-0 z-10 flex items-center justify-center py-4 shadow-md border-b border-zinc-800"
              style={{ backgroundColor: settings?.primaryColor || "#18181b" }}>
        <h1 className="text-lg font-bold tracking-tight">Meus Acessos</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {accesses.length === 0 && (
          <div className="text-center py-10 flex flex-col items-center gap-3">
            <Lock className="w-12 h-12 text-zinc-600" />
            <p className="text-zinc-400">Você ainda não possui conteúdos liberados.</p>
            <Link href={`/store/${slug}`} className="text-blue-500 font-semibold mt-2">
              Ver Catálogo
            </Link>
          </div>
        )}

        {accesses.map(acc => (
          <div key={acc.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex gap-4 items-center">
            <div className="w-20 h-28 bg-zinc-800 rounded-md shrink-0" /> {/* Placeholder Poster */}
            
            <div className="flex-1 min-w-0 flex flex-col h-full justify-between py-1">
              <div>
                <h3 className="font-semibold text-sm line-clamp-2 leading-tight">{acc.product.title}</h3>
                <p className="text-xs text-emerald-500 font-medium mt-1">Acesso Liberado</p>
              </div>
              
              <Link href={`/store/${slug}/player/${acc.productId}`} 
                    className="mt-3 flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-bold transition-colors">
                <PlayCircle className="w-4 h-4" />
                ASSISTIR AGORA
              </Link>
            </div>
          </div>
        ))}
      </main>
      
      {/* TabBar Compartilhada (Em produção, extrair para um componente MobileTabBar) */}
      <nav className="shrink-0 bg-zinc-900 border-t border-zinc-800 flex items-center justify-around py-3 pb-safe">
        <Link href={`/store/${slug}`} className="flex flex-col items-center gap-1 text-zinc-500">
          <span className="text-xs font-medium">Início</span>
        </Link>
        <div className="flex flex-col items-center gap-1 text-blue-500">
          <span className="text-xs font-semibold">Meus Acessos</span>
        </div>
      </nav>
    </div>
  )
}
