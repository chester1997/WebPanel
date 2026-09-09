import { requireUser, requireTenant } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ManualTokenForm } from "./manual-token-form"
import { DisconnectButton } from "./disconnect-button"

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ mp_connected?: string; mp_error?: string }>
}) {
  const user = await requireUser()
  const { tenant } = await requireTenant(user.id)
  const { mp_connected, mp_error } = await searchParams

  const paymentMethod = await db.orm.public.PaymentGatewayConnection.first({ tenantId: tenant.id, isActive: true })
  const isConnected = !!paymentMethod

  const orders = await db.orm.public.Order.where({ tenantId: tenant.id }).all()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const paidThisMonth = orders.filter(
    (o) => o.status === "PAID" && new Date(o.createdAt) >= monthStart
  )
  const monthRevenue = paidThisMonth.reduce((sum, o) => sum + o.totalAmount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Financeiro e Pagamentos</h2>
          <p className="text-zinc-400">Conecte o Mercado Pago para receber pagamentos via PIX, Cartão e Boleto.</p>
        </div>
      </div>

      {mp_connected && (
        <div className="text-sm text-emerald-500 bg-emerald-500/10 p-3 rounded-md border border-emerald-500/20">
          Conta do Mercado Pago conectada com sucesso.
        </div>
      )}
      {mp_error && (
        <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-md border border-red-500/20">
          Não foi possível conectar sua conta do Mercado Pago ({mp_error}).
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Conta Mercado Pago</CardTitle>
            <CardDescription className="text-zinc-400">
              {isConnected
                ? "Sua loja já está conectada e pronta para vender."
                : "Vincule suas credenciais para começar a processar vendas."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isConnected ? (
              <div className="space-y-4">
                <div className="p-4 border border-emerald-500/20 bg-emerald-500/10 rounded-xl">
                  <p className="text-emerald-500 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    Conectado com sucesso
                  </p>
                </div>
                <DisconnectButton />
              </div>
            ) : (
              <div className="space-y-4">
                <a href="/api/mercadopago/authorize">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                    Conectar minha conta (OAuth)
                  </Button>
                </a>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-zinc-900 px-2 text-zinc-500">ou inserir token manualmente</span>
                  </div>
                </div>

                <ManualTokenForm />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Resumo Financeiro</CardTitle>
            <CardDescription className="text-zinc-400">Dados do mês atual.</CardDescription>
          </CardHeader>
          <CardContent>
            {paidThisMonth.length > 0 ? (
              <div className="space-y-1">
                <p className="text-3xl font-black text-emerald-500">
                  {monthRevenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
                <p className="text-sm text-zinc-400">{paidThisMonth.length} pedido(s) pago(s) este mês</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-500 text-center">
                {isConnected ? "Nenhuma transação registrada neste mês." : "Conecte sua conta para ver estatísticas."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
