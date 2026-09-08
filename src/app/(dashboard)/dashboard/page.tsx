import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser, requireTenant } from "@/lib/auth/session";
import { db } from "@/lib/db";

async function getDashboardStats(tenantId: string) {
  const [orders, customers, products, activeSubscriptions] =
    await Promise.all([
      db.orm.public.Order.where({ tenantId }).all(),
      db.orm.public.Customer.where({ tenantId }).aggregate((agg) => ({
        total: agg.count(),
      })),
      db.orm.public.Product.where({ tenantId }).aggregate((agg) => ({
        total: agg.count(),
      })),
      db.orm.public.Subscription
        .where({ tenantId, status: "ACTIVE" })
        .aggregate((agg) => ({ total: agg.count() })),
    ]);

  const paidOrders = orders.filter((o) => o.status === "PAID");
  const revenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const salesToday = paidOrders
    .filter((o) => new Date(o.createdAt) >= today)
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return {
    salesToday,
    revenue,
    ordersCount: orders.length,
    pendingOrders,
    customersCount: customers.total,
    productsCount: products.total,
    activeSubscriptions: activeSubscriptions.total,
  };
}

export default async function DashboardPage() {
  const user = await requireUser();
  const { tenant } = await requireTenant(user.id);
  const stats = await getDashboardStats(tenant.id);

  const hasAnyData = stats.ordersCount > 0 || stats.productsCount > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-zinc-400">
          Acompanhe as métricas de {tenant.name} no Telegram.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-200">
              Vendas Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.salesToday.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-200">
              Faturamento Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.revenue.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-200">
              Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.ordersCount}
            </div>
            <p className="text-xs text-zinc-400">
              {stats.pendingOrders} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-200">
              Assinaturas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.activeSubscriptions}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-200">
              Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.customersCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-200">
              Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.productsCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {!hasAnyData && (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <h3 className="mb-2 text-lg font-semibold">
            Nenhum dado disponível ainda
          </h3>
          <p className="mb-4 text-sm text-zinc-400">
            Conecte seu Bot e crie seu primeiro produto para começar a
            vender.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/bots"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Conectar Bot
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
