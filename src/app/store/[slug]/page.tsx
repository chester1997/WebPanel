import { notFound } from "next/navigation"
import Link from "next/link"
import { Trophy, Package } from "lucide-react"
import { db } from "@/lib/db"
import { AddToCartButton } from "./add-to-cart-button"

export default async function StoreMiniApp({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ categoria?: string }>
}) {
  const { slug } = await params
  const { categoria: categoryFilter } = await searchParams

  const settings = await db.orm.public.MiniAppSettings.first({ slug })

  let tenantId: string
  let primaryColor = "#f97316"
  let storeName = ""
  let description = ""
  let botId: string | null = null

  if (settings) {
    tenantId = settings.tenantId
    primaryColor = settings.primaryColor || "#f97316"
    storeName = settings.storeName
    description = settings.description || ""
    botId = settings.botId
  } else {
    const tenant = await db.orm.public.Tenant.first({ slug })
    if (!tenant) return notFound()
    tenantId = tenant.id
    storeName = tenant.name
  }

  let products = botId
    ? await (async () => {
        const productBots = await db.orm.public.ProductBot.where({ botId: botId! }).all()
        const pIds = productBots.map((pb) => pb.productId)
        if (pIds.length === 0) return []
        const list = await db.orm.public.Product.where((p) => p.id.in(pIds)).all()
        return list.filter((p) => p.status === "ACTIVE")
      })()
    : await db.orm.public.Product.where({
        tenantId,
        status: "ACTIVE",
        showInGeneralStore: true,
      }).all()

  if (categoryFilter) {
    products = products.filter((p) => p.categoryId === categoryFilter)
  }

  const productIds = products.map((p) => p.id)
  const [allPrices, banner] = await Promise.all([
    productIds.length > 0
      ? db.orm.public.ProductPrice.where((p) => p.productId.in(productIds)).all()
      : Promise.resolve([]),
    settings
      ? db.orm.public.MiniAppBanner.first({ settingsId: settings.id, isActive: true })
      : Promise.resolve(null),
  ])

  const pricesByProduct = new Map<string, number>()
  for (const price of allPrices) {
    if (!pricesByProduct.has(price.productId)) {
      pricesByProduct.set(price.productId, price.promotionalPrice ?? price.price)
    }
  }

  // Ranking real: produtos com mais itens vendidos em pedidos PAGOS, não ordem arbitrária.
  const paidOrderItems =
    productIds.length > 0
      ? await db.orm.public.OrderItem.where((i) => i.productId.in(productIds)).all()
      : []
  const salesCount = new Map<string, number>()
  for (const item of paidOrderItems) {
    salesCount.set(item.productId, (salesCount.get(item.productId) ?? 0) + item.quantity)
  }
  const ranked = [...products].sort(
    (a, b) => (salesCount.get(b.id) ?? 0) - (salesCount.get(a.id) ?? 0)
  )
  const top10 = ranked.slice(0, 10)

  return (
    <div className="flex flex-col pb-6 space-y-6">
      {/* Hero Banner */}
      <div className="relative w-full aspect-video bg-zinc-800 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/20 to-transparent z-10" />
        {banner?.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={banner.imageUrl}
            alt={storeName}
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
        )}
        <div className="absolute bottom-4 left-0 w-full z-20 px-4 text-center">
          <h2
            className="text-2xl font-black text-white drop-shadow-md uppercase tracking-wider mb-2"
            style={{ textShadow: `0 0 20px ${primaryColor}` }}
          >
            {storeName}
          </h2>
          {description && (
            <p className="text-[10px] text-zinc-300 uppercase tracking-widest font-semibold mb-3">
              {description}
            </p>
          )}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="px-4 py-16 flex flex-col items-center gap-3 text-center">
          <Package className="w-10 h-10 text-zinc-600" />
          <p className="text-zinc-400 text-sm">
            {categoryFilter ? "Nenhum produto nesta categoria." : "Nenhum produto cadastrado ainda."}
          </p>
        </div>
      ) : (
        <>
          {/* Seção: Top 10 (por vendas reais) */}
          {top10.some((p) => (salesCount.get(p.id) ?? 0) > 0) && (
            <section className="px-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-bold text-white">Mais vendidos</h2>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                {top10.map((product, index) => {
                  const mainPrice = pricesByProduct.get(product.id) ?? 0
                  const rank = index + 1

                  return (
                    <div key={product.id} className="shrink-0 w-[140px] relative snap-start">
                      <div className="h-[200px] rounded-lg bg-zinc-800 overflow-hidden relative border border-zinc-800/50">
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-xs text-zinc-600 text-center p-2">
                            {product.title}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                      </div>

                      <div
                        className="absolute -bottom-2 -left-2 text-7xl font-black italic drop-shadow-2xl z-20"
                        style={{
                          color: "transparent",
                          WebkitTextStroke: `2px ${rank === 1 ? "#eab308" : "#cbd5e1"}`,
                          textShadow: "4px 4px 10px rgba(0,0,0,0.8)",
                        }}
                      >
                        {rank}
                      </div>

                      <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1 z-20">
                        <AddToCartButton slug={slug} productId={product.id} color={primaryColor} size="sm" />
                        <span className="text-[11px] font-bold text-green-400 drop-shadow-md">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                            mainPrice
                          )}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Seção: Catálogo */}
          <section className="px-4 pt-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: primaryColor }} />
              <h2 className="text-lg font-bold text-white uppercase">
                {categoryFilter ? "Categoria" : "Catálogo"}
              </h2>
              <span className="text-xs text-zinc-500">
                {products.length} produto{products.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {products.map((product) => {
                const mainPrice = pricesByProduct.get(product.id) ?? 0

                return (
                  <div
                    key={product.id}
                    className="rounded-lg bg-zinc-800 overflow-hidden relative border border-zinc-800/50 h-[160px]"
                  >
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover opacity-80"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-zinc-800 to-zinc-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent" />

                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-white line-clamp-1">{product.title}</h3>
                        <span className="text-xs font-medium text-green-400 mt-1 block">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                            mainPrice
                          )}
                        </span>
                      </div>
                      <AddToCartButton slug={slug} productId={product.id} color={primaryColor} />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}

      {categoryFilter && (
        <div className="px-4">
          <Link href={`/store/${slug}`} className="text-xs text-zinc-500 underline">
            Limpar filtro de categoria
          </Link>
        </div>
      )}
    </div>
  )
}
