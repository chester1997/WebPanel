import { requireUser, requireTenant } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { ProductForm } from "./product-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default async function ProductsPage() {
  const user = await requireUser()
  const { tenant } = await requireTenant(user.id)
  
  const [products, categories] = await Promise.all([
    db.orm.public.Product.where({ tenantId: tenant.id }).all(),
    db.orm.public.Category.where({ tenantId: tenant.id }).all()
  ])

  // Buscar os preos separadamente pois o ORM no parece suportar "include" da mesma forma
  // pelo o que vimos na tipagem padrao
  const productIds = products.map(p => p.id)
  const allPrices = productIds.length > 0 
    ? await db.orm.public.ProductPrice.where(p => p.productId.in(productIds)).all() 
    : []

  const pricesByProduct = new Map()
  for (const price of allPrices) {
    pricesByProduct.set(price.productId, price)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Produtos</h2>
          <p className="text-zinc-400">Gerencie seu catálogo de produtos e acessos.</p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <ProductForm categories={categories} />
        </div>
        
        <div className="md:col-span-2">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Meus Produtos</CardTitle>
              <CardDescription className="text-zinc-400">Produtos disponíveis na sua loja Mini App.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products.length === 0 && (
                  <div className="text-center py-8 text-zinc-500 text-sm">
                    Nenhum produto cadastrado.
                  </div>
                )}
                {products.map(p => {
                  const cat = categories.find(c => c.id === p.categoryId)
                  const priceInfo = pricesByProduct.get(p.id)

                  return (
                    <div key={p.id} className="p-4 border border-zinc-800 rounded-lg flex items-center justify-between bg-zinc-950">
                      <div>
                        <h4 className="text-white font-medium">{p.title}</h4>
                        <p className="text-xs text-zinc-500 mt-1">
                          {cat?.name || "Sem categoria"} • {p.type}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-500 font-bold">
                          R$ {priceInfo?.price.toFixed(2) || "0.00"}
                        </p>
                        <span className="text-[10px] uppercase bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full mt-1 inline-block">
                          {p.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
