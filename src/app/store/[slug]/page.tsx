import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { Trophy, Plus } from "lucide-react"

export default async function StoreMiniApp({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const tenant = await db.orm.public.Tenant.first({ slug })
  if (!tenant) return notFound()

  const settings = await db.orm.public.MiniAppSettings.first({ tenantId: tenant.id })
  const primaryColor = settings?.primaryColor || "#f97316" // Orange

  const products = await db.orm.public.Product.where({ tenantId: tenant.id, status: "ACTIVE" }).all()
  
  const productIds = products.map(p => p.id)
  const allPrices = productIds.length > 0
    ? await db.orm.public.ProductPrice.where(p => p.productId.in(productIds)).all()
    : []

  const pricesByProduct = new Map()
  for (const price of allPrices) {
    pricesByProduct.set(price.productId, price)
  }

  // Fallback de produtos mockados se a loja estiver vazia, apenas para visualização do novo layout
  const displayProducts = products.length > 0 ? products : [
    { id: "1", title: "Pacto de Sangue", imageUrl: "https://images.unsplash.com/photo-1531259683007-016a7b628fc3?q=80&w=400&auto=format&fit=crop" },
    { id: "2", title: "Meu Terreno Baldio", imageUrl: "https://images.unsplash.com/photo-1533613220915-609f661a6fe1?q=80&w=400&auto=format&fit=crop" },
    { id: "3", title: "Como Chutar um Craque", imageUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400&auto=format&fit=crop" },
    { id: "4", title: "A Batalha Final", imageUrl: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=400&auto=format&fit=crop" }
  ]

  return (
    <div className="flex flex-col pb-6 space-y-6">
      
      {/* Hero Banner */}
      <div className="relative w-full aspect-video bg-zinc-800 flex items-center justify-center overflow-hidden">
        {/* Placeholder de Imagem para o Banner com gradiente e textos sobrepostos */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/20 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=800&auto=format&fit=crop" 
          alt="Hero Banner"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute bottom-4 left-0 w-full z-20 px-4 text-center">
          <h2 className="text-2xl font-black text-white drop-shadow-md uppercase tracking-wider mb-2" style={{ textShadow: `0 0 20px ${primaryColor}` }}>
            BEM VINDO AO APP NOSSA SÉRIES
          </h2>
          <p className="text-[10px] text-zinc-300 uppercase tracking-widest font-semibold mb-3">O Melhor do Entretenimento Sem Limites!</p>
          <div className="flex justify-center gap-2">
             <div className="w-8 h-8 rounded-full border border-yellow-500 flex items-center justify-center bg-black/50"><span className="text-yellow-500 text-xs">⚡</span></div>
             <div className="w-8 h-8 rounded-full border border-purple-500 flex items-center justify-center bg-black/50"><span className="text-purple-500 text-xs">🔗</span></div>
             <div className="w-8 h-8 rounded-full border border-blue-500 flex items-center justify-center bg-black/50"><span className="text-blue-500 text-xs">⭐</span></div>
          </div>
        </div>
      </div>

      {/* Seção: Top 10 da Semana */}
      <section className="px-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-bold text-white">Top 10 da Semana</h2>
          <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase ml-1">Esta Semana</span>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {displayProducts.map((product, index) => {
            const priceInfo = pricesByProduct.get(product.id)
            const mainPrice = priceInfo?.price || 6.00 // fallback 6,00 igual a foto
            const rank = index + 1
            
            return (
              <div key={product.id} className="shrink-0 w-[140px] relative snap-start">
                {/* Imagem do Produto */}
                <div className="h-[200px] rounded-lg bg-zinc-800 overflow-hidden relative border border-zinc-800/50">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-xs text-zinc-600 text-center p-2">
                      {product.title}
                    </div>
                  )}
                  {/* Gradiente Inferior para destacar texto/preço */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                </div>
                
                {/* Número Gigante (Estilo Netflix) */}
                <div 
                  className="absolute -bottom-2 -left-2 text-7xl font-black italic drop-shadow-2xl z-20"
                  style={{
                    color: "transparent",
                    WebkitTextStroke: `2px ${rank === 1 ? '#eab308' : '#cbd5e1'}`,
                    textShadow: "4px 4px 10px rgba(0,0,0,0.8)"
                  }}
                >
                  {rank}
                </div>

                {/* Preço e Botão Adicionar */}
                <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1 z-20">
                  <button 
                    className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold shadow-lg transition-transform active:scale-95"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-bold text-green-400 drop-shadow-md">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(mainPrice)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Seção: TOP Brasileira */}
      <section className="px-4 pt-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: primaryColor }} />
          <h2 className="text-lg font-bold text-white uppercase">1 TOP _ BRASILEIRA</h2>
          <span className="text-xs text-zinc-500">1 plano</span>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {displayProducts.slice().reverse().map((product) => {
            const priceInfo = pricesByProduct.get(product.id)
            const mainPrice = priceInfo?.price || 6.00
            
            return (
              <div key={product.id + "_2"} className="shrink-0 w-[240px] relative snap-start">
                <div className="h-[135px] rounded-lg bg-zinc-800 overflow-hidden relative border border-zinc-800/50">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover opacity-80" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-zinc-800 to-zinc-900" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent" />
                  
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white line-clamp-1">{product.title}</h3>
                      <span className="text-xs font-medium text-green-400 mt-1 block">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(mainPrice)}
                      </span>
                    </div>
                    <button 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
