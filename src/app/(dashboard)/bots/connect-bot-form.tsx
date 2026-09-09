"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { connectBotAction } from "@/modules/bots/actions";
import { AlertCircle, CheckCircle2, Save } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
      {pending ? "Salvando..." : "Salvar"}
    </Button>
  );
}

export function ConnectBotForm({ onCancel }: { onCancel?: () => void }) {
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null);

  async function clientAction(formData: FormData) {
    const res = await connectBotAction(formData);
    setResult(res);
  }

  return (
    <form action={clientAction} className="space-y-4 bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="token" className="text-zinc-300">Token do Bot (BotFather)</Label>
          <Input id="token" name="token" required className="font-mono bg-zinc-950 border-zinc-800" placeholder="1234567890:AAH_..." />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-zinc-300">Nome Exibido no Mini App</Label>
            <Input id="displayName" name="displayName" className="bg-zinc-950 border-zinc-800" placeholder="Ex: Minha Loja" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryColor" className="text-zinc-300">Cor Principal</Label>
            <div className="flex gap-2">
              <Input id="primaryColor" name="primaryColor" type="color" defaultValue="#f97316" className="w-12 h-10 p-1 bg-zinc-950 border-zinc-800" />
              <Input type="text" defaultValue="#f97316" disabled className="bg-zinc-950 border-zinc-800 text-zinc-400 font-mono" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="buttonText" className="text-zinc-300">Nome do Botão Telegram</Label>
          <Input id="buttonText" name="buttonText" className="bg-zinc-950 border-zinc-800" defaultValue="Abrir Loja" placeholder="Ex: Abrir Loja" />
        </div>
      </div>

      {result?.error && (
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 p-3 rounded-md border border-red-500/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {result.error}
        </div>
      )}

      {result?.success && (
        <div className="flex items-center gap-2 text-sm text-emerald-500 bg-emerald-500/10 p-3 rounded-md border border-emerald-500/20">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Bot e Mini App configurados com sucesso!
        </div>
      )}

      <div className="pt-4 flex gap-3">
        <SubmitButton />
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
