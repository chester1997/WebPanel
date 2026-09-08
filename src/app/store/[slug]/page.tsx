import { notFound } from "next/navigation"
import { db } from "@/lib/db"

export default async function StoreMiniApp({ params }: { params: { slug: string } }) {
  const { slug } = params

  const tenant = await db.tenant.findUnique({
    where: { slug },
    include: {
      categories: true,
      products: {
        where: { status: "ACTIVE" },
        include: { prices: true }
      },
      miniAppSettings: true
    }
  })

  if (!tenant) return notFound()

  const settings = tenant.miniAppSettings

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col"
         style={{ backgroundColor: settings?.secondaryColor || "#09090b" }}>
      
      {/* Header Mobile / Mini App */}
      <header 
        className="sticky top-0 z-10 flex items-center justify-center py-4 shadow-md"
        style={{ backgroundColor: settings?.primaryColor || "#18181b" }}
      >
        <h1 className="text-xl font-bold tracking-tight">{settings?.storeName || tenant.name}</h1>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
        
        {/* Categorias (Horizontal Scroll) */}
        {tenant.categories.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Categorias</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {tenant.categories.map(cat => (
                <div key={cat.id} className="shrink-0 bg-zinc-800 px-4 py-2 rounded-full text-sm font-medium">
                  {cat.name}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Produtos */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Destaques</h2>
          <div className="grid grid-cols-2 gap-4">
            {tenant.products.map(product => {
              const mainPrice = product.prices[0]?.price || 0
              
              return (
                <div key={product.id} className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 flex flex-col">
                  <div className="h-32 bg-zinc-800 w-full animate-pulse" /> {/* Placeholder Image */}
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-medium text-sm line-clamp-2 leading-tight">{product.title}</h3>
                    <div className="mt-auto pt-3">
                      <span className="font-bold text-blue-500">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(mainPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {tenant.products.length === 0 && (
            <div className="text-center text-zinc-500 py-10">Nenhum produto cadastrado</div>
          )}
        </section>
      </main>
      
      {/* TabBar (Mobile App Feeling) */}
      <nav className="shrink-0 bg-zinc-900 border-t border-zinc-800 flex items-center justify-around py-3 pb-safe">
        <button className="flex flex-col items-center gap-1 text-blue-500">
          <span className="text-xs font-semibold">Início</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300">
          <span className="text-xs font-medium">Categorias</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300">
          <span className="text-xs font-medium">Carrinho</span>
        </button>
      </nav>
    </div>
  )
}
