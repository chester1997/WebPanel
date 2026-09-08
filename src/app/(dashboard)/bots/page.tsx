import { requireUser, requireTenant } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { ConnectBotForm } from "./connect-bot-form"
import { RemoveBotButton } from "./remove-bot-button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BotIcon, CheckCircle2 } from "lucide-react"

export default async function BotsPage() {
  const user = await requireUser()
  const { tenant } = await requireTenant(user.id)
  
  const bot = await db.orm.public.Bot.first({ tenantId: tenant.id })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Meus Bots</h2>
          <p className="text-zinc-400">Conecte o bot do Telegram que atuará como sua loja.</p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Bot Ativo</CardTitle>
              <CardDescription className="text-zinc-400">O bot principal que seus clientes acessam.</CardDescription>
            </CardHeader>
            <CardContent>
              {bot ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 border border-zinc-800 rounded-xl bg-zinc-950">
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center shrink-0">
                      <BotIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">@{bot.username}</h4>
                      <div className="flex items-center gap-1 text-emerald-500 text-xs mt-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Webhook ativo e validado</span>
                      </div>
                    </div>
                  </div>
                  <RemoveBotButton />
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-zinc-400 text-sm mb-4">Nenhum bot conectado no momento.</p>
                  <ConnectBotForm />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Como conectar?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-zinc-300">
              <ol className="list-decimal list-inside space-y-3">
                <li>Abra o Telegram e busque pelo <span className="text-blue-400 font-mono">@BotFather</span>.</li>
                <li>Envie o comando <span className="bg-zinc-800 px-1 py-0.5 rounded font-mono text-blue-300">/newbot</span>.</li>
                <li>Escolha um nome e um username terminado em "bot".</li>
                <li>Copie o token fornecido (ex: <span className="text-zinc-500 font-mono">123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11</span>).</li>
                <li>Cole o token no campo ao lado e clique em Conectar.</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
