import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Server, Users, Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

async function loadPlatformOverview() {
  const start = Date.now();
  const [tenants, users, plans] = await Promise.all([
    db.orm.public.Tenant.all(),
    db.orm.public.User.all(),
    db.orm.public.Plan.all(),
  ]);
  return { tenants, users, plans, dbLatencyMs: Date.now() - start };
}

export default async function SuperAdminDashboard() {
  const user = await requireUser();
  if (!user.isSuperAdmin) {
    redirect("/dashboard");
  }

  const { tenants, users, plans, dbLatencyMs } = await loadPlatformOverview();

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Super Admin</h1>
          <p className="text-zinc-400">
            Visão global da plataforma e todos os lojistas (tenants).
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">
              Total de lojas
            </CardTitle>
            <Server className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
            <p className="text-xs text-zinc-500">Tenants registrados na base</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">
              Usuários
            </CardTitle>
            <Users className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-zinc-500">Administradores e vendedores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">
              Faturamento da plataforma
            </CardTitle>
            <Wallet className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-400">Em breve</div>
            <p className="text-xs text-zinc-500">
              Depende de PlatformSubscription (billing dos vendedores)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">
              Banco de dados
            </CardTitle>
            <Activity className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {dbLatencyMs}ms
            </div>
            <p className="text-xs text-zinc-500">
              Latência das consultas acima
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4">Planos da plataforma</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.length === 0 && (
          <p className="text-sm text-zinc-500 col-span-full">
            Nenhum plano cadastrado. Rode o seed (`npm run db:seed`).
          </p>
        )}
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <p className="text-2xl font-bold text-white">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: plan.currency,
                }).format(plan.price)}
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-zinc-400">
                Status: {plan.isActive ? "Ativo" : "Inativo"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
