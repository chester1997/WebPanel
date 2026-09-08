"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { connectMercadoPagoManual } from "@/modules/payments/actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CreditCard, CheckCircle2, AlertCircle } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Conectando..." : "Testar e Salvar"}
    </Button>
  )
}

export default function FinancePage() {
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null)

  async function clientAction(formData: FormData) {
    const res = await connectMercadoPagoManual(formData)
    setResult(res)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Financeiro</h2>
        <p className="text-zinc-400">Gerencie seus gateways de pagamento e recebimentos.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-500" />
              Mercado Pago
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Conecte sua conta para receber pagamentos via PIX e Cartão diretamente na sua Mini App.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result?.success ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm text-emerald-500 bg-emerald-500/10 p-3 rounded-md border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                  Conta Conectada (Token Manual Salvo)
                </div>
                <Button variant="outline" className="text-zinc-400 border-zinc-800">
                  Desconectar
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  Conectar Minha Conta (OAuth)
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-zinc-900 px-2 text-zinc-500">OU INSERIR TOKEN MANUALMENTE</span>
                  </div>
                </div>

                <form action={clientAction} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Access Token (PROD)</label>
                    <Input 
                      name="accessToken" 
                      required 
                      type="password"
                      placeholder="APP_USR-XXXXXXXXXXXXXXXX"
                      className="bg-zinc-950 border-zinc-800 text-white" 
                    />
                  </div>
                  {result?.error && (
                    <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 p-3 rounded-md border border-red-500/20">
                      <AlertCircle className="w-4 h-4" />
                      {result.error}
                    </div>
                  )}
                  <SubmitButton />
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
