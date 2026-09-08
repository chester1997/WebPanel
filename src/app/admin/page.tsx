import { requireUser } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Server, Users, Wallet } from "lucide-react"
import { redirect } from "next/navigation"

export default async function SuperAdminDashboard() {
  const user = await requireUser()
  
  if (!user.isSuperAdmin) {
    redirect("/dashboard")
  }

  const [tenants, users, plans] = await Promise.all([
    db.orm.public.Tenant.all(),
    db.orm.public.User.all(),
    db.orm.public.Plan.all()
  ])

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Super Admin</h1>
          <p className="text-zinc-400">Visão global da plataforma e todos os Lojistas (Tenants).</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">Total de Lojas</CardTitle>
            <Server className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
            <p className="text-xs text-zinc-500">Tenants registrados na base</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">Usuários</CardTitle>
            <Users className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-zinc-500">Administradores e vendedores</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">Faturamento App</CardTitle>
            <Wallet className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-400">Em breve</div>
            <p className="text-xs text-zinc-500">Billing integrado</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">Saúde do Sistema</CardTitle>
            <Activity className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">Normal</div>
            <p className="text-xs text-zinc-500">Latência do banco em ms</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4">Planos da Plataforma</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.length === 0 && (
          <div className="text-zinc-500 text-sm">Nenhum plano cadastrado.</div>
        )}
        {plans.map(plan => (
          <Card key={plan.id} className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <p className="text-2xl font-bold text-white">R$ {plan.price}</p>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-zinc-400">Status: {plan.isActive ? "Ativo" : "Inativo"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
