import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser, requireTenant } from "@/lib/auth/session";
import { db } from "@/lib/db";

export default async function OrdersPage() {
  const user = await requireUser();
  const { tenant } = await requireTenant(user.id);

  const orders = await db.orm.public.Order.where({ tenantId: tenant.id }).all();
  orders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const customerIds = [...new Set(orders.map((o) => o.customerId))];
  const orderIds = orders.map((o) => o.id);

  const [customers, items] = await Promise.all([
    customerIds.length > 0
      ? db.orm.public.Customer.where((c) => c.id.in(customerIds)).all()
      : Promise.resolve([]),
    orderIds.length > 0
      ? db.orm.public.OrderItem.where((i) => i.orderId.in(orderIds)).all()
      : Promise.resolve([]),
  ]);

  const productIds = [...new Set(items.map((i) => i.productId))];
  const products =
    productIds.length > 0
      ? await db.orm.public.Product.where((p) => p.id.in(productIds)).all()
      : [];

  const customerById = new Map(customers.map((c) => [c.id, c]));
  const productById = new Map(products.map((p) => [p.id, p]));
  const firstItemByOrder = new Map<string, (typeof items)[number]>();
  for (const item of items) {
    if (!firstItemByOrder.has(item.orderId)) {
      firstItemByOrder.set(item.orderId, item);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Pedidos</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-white">Histórico de vendas</CardTitle>
          <CardDescription>
            Todos os pedidos realizados pelos clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-zinc-300">
              <thead className="text-xs uppercase bg-zinc-950 text-zinc-400">
                <tr>
                  <th className="px-4 py-3 rounded-tl-md">ID do pedido</th>
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
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                      Nenhum pedido encontrado.
                    </td>
                  </tr>
                )}
                {orders.map((order) => {
                  const customer = customerById.get(order.customerId);
                  const firstItem = firstItemByOrder.get(order.id);
                  const product = firstItem
                    ? productById.get(firstItem.productId)
                    : undefined;

                  return (
                    <tr
                      key={order.id}
                      className="border-b border-zinc-800 hover:bg-zinc-800/50"
                    >
                      <td className="px-4 py-3 font-mono text-xs">
                        {order.id.split("-")[0]}...
                      </td>
                      <td className="px-4 py-3">
                        {customer?.name || customer?.telegramUsername || "Cliente"}
                      </td>
                      <td className="px-4 py-3">{product?.title || "-"}</td>
                      <td className="px-4 py-3">
                        {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: order.currency,
                        }).format(order.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === "PAID"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : order.status === "PENDING"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-zinc-500/10 text-zinc-400"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
