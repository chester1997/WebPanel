import { requireUser, requireTenant } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  BarChart3,
  Package,
  Users,
  UserPlus,
  Clock
} from "lucide-react";

interface Tier {
  name: string;
  min: number;
}

const TIERS: Tier[] = [
  { name: "Bronze", min: 0 },
  { name: "Silver", min: 1000 },
  { name: "Gold", min: 5000 },
  { name: "Platinum", min: 20000 },
];

function getTierProgress(revenue: number) {
  let currentIndex = 0;
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (revenue >= TIERS[i].min) {
      currentIndex = i;
      break;
    }
  }
  const current = TIERS[currentIndex];
  const next = TIERS[currentIndex + 1] ?? null;

  if (!next) {
    return { current, next: null, remaining: 0, percent: 100 };
  }

  const span = next.min - current.min;
  const progressInTier = revenue - current.min;
  const percent = Math.min(100, Math.max(0, (progressInTier / span) * 100));

  return {
    current,
    next,
    remaining: Math.max(0, next.min - revenue),
    percent,
  };
}

async function getDashboardStats(tenantId: string) {
  const [orders, customers, products] = await Promise.all([
    db.orm.public.Order.where({ tenantId }).all(),
    db.orm.public.Customer.where({ tenantId }).all(),
    db.orm.public.Product.where({ tenantId }).all(),
  ]);

  const paidOrders = orders.filter((o) => o.status === "PAID");
  const revenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const salesToday = paidOrders
    .filter((o) => new Date(o.createdAt) >= today)
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const ordersToday = paidOrders.filter((o) => new Date(o.createdAt) >= today).length;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sales7Days = paidOrders
    .filter((o) => new Date(o.createdAt) >= sevenDaysAgo)
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const orders7Days = paidOrders.filter((o) => new Date(o.createdAt) >= sevenDaysAgo).length;

  const ticketMedio = paidOrders.length > 0 ? revenue / paidOrders.length : 0;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newCustomers = customers.filter(c => new Date(c.createdAt) >= thirtyDaysAgo).length;

  return {
    salesToday,
    ordersToday,
    sales7Days,
    orders7Days,
    revenue,
    paidOrdersCount: paidOrders.length,
    ticketMedio,
    pendingOrders,
    customersCount: customers.length,
    newCustomers,
    productsCount: products.length,
  };
}

export default async function DashboardPage() {
  const user = await requireUser();
  const { tenant } = await requireTenant(user.id);
  const stats = await getDashboardStats(tenant.id);
  const tier = getTierProgress(stats.revenue);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Olá, {user.name?.split(" ")[0] || "Admin"}</h2>
        <p className="text-zinc-400 mt-1">
          Visão geral do seu negócio
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Vendas Hoje */}
        <div className="bg-[#11131e] border border-[#1f2235] p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-3xl font-black text-emerald-500 mb-1">
            {stats.salesToday.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </h3>
          <p className="text-sm text-zinc-400 font-medium">Vendas hoje</p>
          <p className="text-xs text-zinc-500 mt-1">{stats.ordersToday} pedidos</p>
        </div>

        {/* Últimos 7 dias */}
        <div className="bg-[#11131e] border border-[#1f2235] p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <h3 className="text-3xl font-black text-blue-500 mb-1">
            {stats.sales7Days.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </h3>
          <p className="text-sm text-zinc-400 font-medium">Últimos 7 dias</p>
          <p className="text-xs text-zinc-500 mt-1">{stats.orders7Days} pedidos</p>
        </div>

        {/* Receita Total */}
        <div className="bg-[#11131e] border border-[#1f2235] p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
            <DollarSign className="w-5 h-5" />
          </div>
          <h3 className="text-3xl font-black text-purple-500 mb-1">
            {stats.revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </h3>
          <p className="text-sm text-zinc-400 font-medium">Receita total</p>
          <p className="text-xs text-zinc-500 mt-1">{stats.paidOrdersCount} aprovados</p>
        </div>

        {/* Ticket Médio */}
        <div className="bg-[#11131e] border border-[#1f2235] p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h3 className="text-3xl font-black text-orange-500 mb-1">
            {stats.ticketMedio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </h3>
          <p className="text-sm text-zinc-400 font-medium">Ticket médio</p>
          <p className="text-xs text-zinc-500 mt-1">&nbsp;</p>
        </div>

        {/* Produtos Ativos */}
        <div className="bg-[#11131e] border border-[#1f2235] p-6 rounded-2xl relative overflow-hidden flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-emerald-500 mb-1">{stats.productsCount}</h3>
            <p className="text-xs text-zinc-400 font-medium uppercase">Produtos ativos</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Total Clientes */}
        <div className="bg-[#11131e] border border-[#1f2235] p-6 rounded-2xl relative overflow-hidden flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-blue-500 mb-1">{stats.customersCount}</h3>
            <p className="text-xs text-zinc-400 font-medium uppercase">Total clientes</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Novos 30 dias */}
        <div className="bg-[#11131e] border border-[#1f2235] p-6 rounded-2xl relative overflow-hidden flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-cyan-400 mb-1">{stats.newCustomers}</h3>
            <p className="text-xs text-zinc-400 font-medium uppercase">Novos (30 dias)</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center text-cyan-400">
            <UserPlus className="w-5 h-5" />
          </div>
        </div>

        {/* Pendentes */}
        <div className="bg-[#11131e] border border-[#1f2235] p-6 rounded-2xl relative overflow-hidden flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-yellow-500 mb-1">{stats.pendingOrders}</h3>
            <p className="text-xs text-zinc-400 font-medium uppercase">PIX Pendente</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>
      
      {/* Gamificação / Classificação por receita total real */}
      <div className="bg-[#11131e] border border-[#1f2235] p-8 rounded-2xl relative overflow-hidden flex items-center gap-6">
        <div className="w-20 h-20 bg-orange-500/20 rotate-45 rounded-xl flex items-center justify-center shrink-0">
          <div className="w-14 h-14 bg-orange-500 -rotate-45 rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.4)]" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-zinc-500 tracking-wider uppercase mb-1">Sua Classificação</p>
          <h3 className="text-2xl font-bold text-orange-500 mb-1">{tier.current.name}</h3>
          <p className="text-sm text-zinc-400 mb-4">
            {tier.next ? (
              <>
                Faltam{" "}
                <strong className="text-white">
                  {tier.remaining.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </strong>{" "}
                para {tier.next.name}
              </>
            ) : (
              "Você atingiu o nível máximo!"
            )}
          </p>

          <div className="w-full h-2 bg-[#1f2235] rounded-full overflow-hidden">
            <div className="h-full bg-orange-500" style={{ width: `${tier.percent}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-zinc-500 font-medium">
            <span>{stats.revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            <span>
              {(tier.next?.min ?? tier.current.min).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
        </div>
        <div className="hidden md:flex flex-col gap-2 text-xs font-semibold">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`flex items-center gap-2 ${t.name === tier.current.name ? "text-orange-500" : "text-zinc-500"}`}
            >
              <span className={`w-2 h-2 rounded-full ${t.name === tier.current.name ? "bg-orange-500" : "bg-zinc-600"}`} />
              {t.name}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
