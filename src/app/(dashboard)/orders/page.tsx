import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const getTenantId = () => "cl_fake_tenant_id" 

export default async function OrdersPage() {
  const tenantId = getTenantId()
  
  const orders = await db.order.findMany({
    where: { tenantId },
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" }
  })

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
                  <th className="px-4 py-3">Produto</th>
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
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                    <td className="px-4 py-3 font-mono text-xs">{order.id.split('-')[0]}...</td>
                    <td className="px-4 py-3">{order.customer.name || order.customer.telegramUsername || "Cliente"}</td>
                    <td className="px-4 py-3">{order.items[0]?.product.title || "-"}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
