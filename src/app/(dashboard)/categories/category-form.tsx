"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { createCategory } from "@/modules/catalog/actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Salvando..." : "Criar Categoria"}
    </Button>
  )
}

export function CategoryForm() {
  const [msg, setMsg] = useState("")

  async function clientAction(formData: FormData) {
    const res = await createCategory(formData)
    if (res?.error) setMsg(res.error)
    else setMsg("Categoria salva com sucesso!")
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Nova Categoria</CardTitle>
        <CardDescription className="text-zinc-400">Crie seções para organizar seus produtos.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={clientAction} className="space-y-4">
          <div>
            <label className="text-sm text-zinc-300 mb-1 block">Nome da Categoria</label>
            <Input name="name" required className="bg-zinc-950 border-zinc-800 text-white" />
          </div>
          {msg && <p className="text-sm text-emerald-500">{msg}</p>}
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}
