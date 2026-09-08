"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { connectBotAction } from "@/modules/bots/actions"
import { MessageSquare, CheckCircle2, AlertCircle } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Conectando..." : "Verificar Conexão"}
    </Button>
  )
}

export default function BotsPage() {
  const [result, setResult] = useState<{ error?: string; success?: boolean; bot?: any } | null>(null)

  async function clientAction(formData: FormData) {
    const res = await connectBotAction(formData)
    setResult(res)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Telegram Bots</h2>
        <p className="text-zinc-400">Gerencie a conexão da sua loja com o Telegram.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Adicionar Novo Bot
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Cole o Token gerado pelo BotFather no Telegram.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={clientAction} className="space-y-4">
              {/* Tenant Mock para testes (Fase 2) */}
              <input type="hidden" name="tenantId" value="studio-shorts" />
              
              <div className="space-y-2">
                <label htmlFor="token" className="text-sm font-medium text-zinc-300">
                  Token do BotFather
                </label>
                <Input
                  id="token"
                  name="token"
                  placeholder="1234567890:AAH_XXXXXXXXXXXXX"
                  required
                  className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 font-mono"
                />
              </div>

              {result?.error && (
                <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 p-3 rounded-md border border-red-500/20">
                  <AlertCircle className="w-4 h-4" />
                  {result.error}
                </div>
              )}

              {result?.success && (
                <div className="flex items-center gap-2 text-sm text-emerald-500 bg-emerald-500/10 p-3 rounded-md border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                  Bot @{result.bot.username} conectado e webhook configurado!
                </div>
              )}

              <SubmitButton />
            </form>
          </CardContent>
        </Card>

        {/* Lista de Bots (Para fase 2 exibimos o mock de conectados) */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Bots Conectados</CardTitle>
            <CardDescription className="text-zinc-400">
              Bots atualmente vinculados à sua loja.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result?.success ? (
               <div className="flex items-center justify-between p-4 border border-zinc-800 rounded-lg bg-zinc-950">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                   {result.bot.first_name.charAt(0)}
                 </div>
                 <div>
                   <p className="text-sm font-medium text-white">{result.bot.first_name}</p>
                   <p className="text-xs text-zinc-400">@{result.bot.username}</p>
                 </div>
               </div>
               <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                 Conectado
               </span>
             </div>
            ) : (
              <div className="text-center py-8 text-sm text-zinc-500">
                Nenhum bot conectado ainda.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
