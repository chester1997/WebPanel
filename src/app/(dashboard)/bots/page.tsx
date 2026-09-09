import { requireUser, requireTenant } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { ConnectBotForm } from "./connect-bot-form"
import { RemoveBotButton } from "./remove-bot-button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BotIcon, CheckCircle2, Copy, ExternalLink, Pencil, Info, Trash2, Lock, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function BotsPage() {
  const user = await requireUser()
  const { tenant } = await requireTenant(user.id)
  
  const bot = await db.orm.public.Bot.first({ tenantId: tenant.id })
  const miniAppSettings = bot ? await db.orm.public.MiniAppSettings.first({ botId: bot.id }) : null
  
  const appUrl = process.env.APP_URL || "https://web-panel-5gpgznu9c-luizs-projects-0434a0fd.vercel.app"
  const generalStoreUrl = `${appUrl}/store/${tenant.slug}`
  const botStoreUrl = miniAppSettings ? `${appUrl}/store/${miniAppSettings.slug}` : ""

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Bots Telegram</h2>
          <p className="text-zinc-400">Plano TRIAL — {bot ? "1" : "0"}/1 bot</p>
        </div>
      </div>
      
      {bot && (
        <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl flex items-center justify-between">
          <p className="text-orange-400 text-sm">Limite de 1 bot do plano TRIAL atingido. Faça upgrade para adicionar mais.</p>
          <Button variant="default" className="bg-orange-500 hover:bg-orange-600 text-white" size="sm">Fazer upgrade</Button>
        </div>
      )}

      <div className="space-y-6 max-w-4xl">
        {/* Loja Geral */}
        <Card className="bg-[#11131e] border-zinc-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <Globe className="w-5 h-5 text-blue-400" />
              Loja Geral (sem bot)
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Link único da sua loja — funciona sem Telegram, exibe todos os produtos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-[#0b0f19] p-3 rounded-lg border border-zinc-800/50 text-sm text-zinc-300 font-mono overflow-hidden text-ellipsis mb-4">
              {generalStoreUrl}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="bg-transparent border-zinc-700 hover:bg-zinc-800 text-zinc-300">
                <Copy className="w-4 h-4 mr-2" /> Copiar
              </Button>
              <Link href={generalStoreUrl} target="_blank">
                <Button variant="outline" className="w-full bg-transparent border-zinc-700 hover:bg-zinc-800 text-zinc-300">
                  <ExternalLink className="w-4 h-4 mr-2" /> Abrir
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {bot ? (
          <Card className="bg-[#11131e] border-zinc-800/50">
            <CardContent className="p-0">
              <div className="p-6 border-b border-zinc-800/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#0b0f19] border border-zinc-800 rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative">
                    {miniAppSettings?.logoUrl ? (
                      <img src={miniAppSettings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <BotIcon className="w-7 h-7 text-orange-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg uppercase">{miniAppSettings?.storeName || bot.name}</h3>
                    <p className="text-zinc-400 text-sm">@{bot.username}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Link do Bot no Telegram
                  </h4>
                  <div className="bg-[#0b0f19] p-3 rounded-lg border border-zinc-800/50 text-sm text-zinc-300 font-mono overflow-hidden text-ellipsis mb-3">
                    https://t.me/{bot.username}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="bg-transparent border-zinc-700 hover:bg-zinc-800 text-zinc-300">
                      <Copy className="w-4 h-4 mr-2" /> Copiar link
                    </Button>
                    <Link href={`https://t.me/${bot.username}`} target="_blank">
                      <Button variant="outline" className="w-full bg-transparent border-zinc-700 hover:bg-zinc-800 text-zinc-300">
                        <ExternalLink className="w-4 h-4 mr-2" /> Abrir no Telegram
                      </Button>
                    </Link>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                    Loja deste bot (fora do Telegram)
                  </h4>
                  <div className="bg-[#0b0f19] p-3 rounded-lg border border-zinc-800/50 text-sm text-zinc-300 font-mono overflow-hidden text-ellipsis mb-3">
                    {botStoreUrl}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="bg-transparent border-zinc-700 hover:bg-zinc-800 text-zinc-300">
                      <Copy className="w-4 h-4 mr-2" /> Copiar
                    </Button>
                    <Link href={botStoreUrl} target="_blank">
                      <Button variant="outline" className="w-full bg-transparent border-zinc-700 hover:bg-zinc-800 text-zinc-300">
                        <ExternalLink className="w-4 h-4 mr-2" /> Abrir loja
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-zinc-800/50 bg-[#0b0f19]/50 flex items-center justify-between">
                <Button variant="outline" className="bg-transparent border-zinc-700 hover:bg-zinc-800 text-zinc-300 flex-1 mr-2">
                  <Pencil className="w-4 h-4 mr-2" /> Editar
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="bg-transparent border-zinc-700 hover:bg-zinc-800 text-zinc-300">
                    <Info className="w-4 h-4" />
                  </Button>
                  <RemoveBotButton botId={bot.id} />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="pt-4">
            <h3 className="text-lg font-medium text-white mb-4">Adicionar Bot Telegram</h3>
            <ConnectBotForm />
          </div>
        )}
      </div>
    </div>
  )
}
