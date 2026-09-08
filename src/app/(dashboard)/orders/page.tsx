import { requireUser, requireTenant } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default async function OrdersPage() {
  const user = await requireUser()
  const { tenant } = await requireTenant(user.id)
  
  const orders = await db.orm.public.Order.where({ tenantId: tenant.id }).all()

  // Buscar clientes e items para esses pedidos (Relacionamentos Manuais no ORM Customizado)
  const customerIds = orders.map(o => o.customerId)
  const orderIds = orders.map(o => o.id)

  const [customers, allItems] = await Promise.all([
    customerIds.length > 0 ? db.orm.public.Customer.where(c => c.id.in(customerIds)).all() : [],
    orderIds.length > 0 ? db.orm.public.OrderItem.where(i => i.orderId.in(orderIds)).all() : []
  ])

  // Map customers
  const customersMap = new Map()
  for (const c of customers) customersMap.set(c.id, c)

  // Map Items and fetch products
  const productIds = allItems.map(i => i.productId)
  const products = productIds.length > 0 ? await db.orm.public.Product.where(p => p.id.in(productIds)).all() : []
  const productsMap = new Map()
  for (const p of products) productsMap.set(p.id, p)

  const itemsByOrder = new Map()
  for (const item of allItems) {
    if (!itemsByOrder.has(item.orderId)) itemsByOrder.set(item.orderId, [])
    itemsByOrder.get(item.orderId).push(item)
  }

  // Ordenar por data
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Pedidos</h2>
      
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Histórico de Vendas</CardTitle>
          <CardDescription className="text-zinc-400">Todos os pedidos realizados pelos clientes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-zinc-300">
              <thead className="text-xs uppercase bg-zinc-950 text-zinc-400">
                <tr>
                  <th className="px-4 py-3 rounded-tl-md">ID do Pedido</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Produto(s)</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3 rounded-tr-md">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Nenhum pedido encontrado.</td>
                  </tr>
                )}
                {orders.map(order => {
                  const cust = customersMap.get(order.customerId)
                  const items = itemsByOrder.get(order.id) || []
                  const firstProductName = items.length > 0 ? productsMap.get(items[0].productId)?.title : "-"
                  
                  return (
                    <tr key={order.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                      <td className="px-4 py-3 font-mono text-xs">{order.id.split('-')[0]}...</td>
                      <td className="px-4 py-3">{cust?.name || cust?.telegramUsername || "Cliente"}</td>
                      <td className="px-4 py-3">{firstProductName} {items.length > 1 ? `(+${items.length - 1})` : ''}</td>
                      <td className="px-4 py-3">{new Date(order.createdAt).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-3 font-medium">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: order.currency }).format(order.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === "PAID" ? "bg-emerald-500/10 text-emerald-500" :
                          order.status === "PENDING" ? "bg-amber-500/10 text-amber-500" :
                          "bg-zinc-500/10 text-zinc-400"
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
