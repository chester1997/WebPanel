import { requireUser, requireTenant } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ManualTokenForm } from "./manual-token-form"
import { DisconnectButton } from "./disconnect-button"

export default async function FinancePage() {
  const user = await requireUser()
  const { tenant } = await requireTenant(user.id)
  
  const paymentMethod = await db.orm.public.PaymentGatewayConnection.first({ tenantId: tenant.id })
  const isConnected = !!paymentMethod

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Financeiro e Pagamentos</h2>
          <p className="text-zinc-400">Conecte o Mercado Pago para receber pagamentos via PIX, Cartão e Boleto.</p>
        </div>
      </div>
      
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
              <div className="space-y-6">
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
            <div className="flex flex-col items-center justify-center py-10 text-zinc-500">
              {isConnected ? "Nenhuma transação registrada neste mês." : "Conecte sua conta para ver estatísticas."}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
