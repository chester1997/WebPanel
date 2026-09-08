"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { createProduct } from "@/modules/catalog/actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Criando..." : "Criar Produto"}
    </Button>
  )
}

export default function ProductsPage() {
  const [msg, setMsg] = useState("")

  async function clientAction(formData: FormData) {
    const res = await createProduct(formData)
    if (res?.error) setMsg(res.error)
    else setMsg("Produto criado com sucesso!")
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Produtos</h2>
      
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Novo Produto</CardTitle>
          <CardDescription className="text-zinc-400">Adicione um novo produto à sua loja.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={clientAction} className="space-y-4 max-w-sm">
            <div>
              <label className="text-sm text-zinc-300">Título</label>
              <Input name="title" required className="bg-zinc-950 border-zinc-800 text-white" />
            </div>
            <div>
              <label className="text-sm text-zinc-300">Preço (R$)</label>
              <Input name="price" type="number" step="0.01" required className="bg-zinc-950 border-zinc-800 text-white" />
            </div>
            <div>
              <label className="text-sm text-zinc-300">Tipo</label>
              <select name="type" className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white">
                <option value="DIGITAL">Produto Digital</option>
                <option value="SUBSCRIPTION">Assinatura</option>
                <option value="ACCESS">Acesso (VIP)</option>
              </select>
            </div>
            {msg && <p className="text-sm text-emerald-500">{msg}</p>}
            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
