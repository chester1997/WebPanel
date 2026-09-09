"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateBotNotificationsAction } from "@/modules/bots/actions";
import { AlertCircle, CheckCircle2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-orange-500 hover:bg-orange-600 text-white">
      {pending ? "Salvando..." : "Salvar"}
    </Button>
  );
}

export function BotConfigForm({
  botId,
  welcomeMsg,
  notifyTelegramId,
}: {
  botId: string;
  welcomeMsg: string;
  notifyTelegramId: string;
}) {
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null);

  async function clientAction(formData: FormData) {
    const res = await updateBotNotificationsAction(formData);
    setResult(res);
  }

  return (
    <form action={clientAction} className="space-y-5">
      <input type="hidden" name="botId" value={botId} />

      <div className="space-y-2">
        <Label htmlFor="welcomeMsg" className="text-zinc-300">Mensagem de boas-vindas no bot</Label>
        <Textarea
          id="welcomeMsg"
          name="welcomeMsg"
          defaultValue={welcomeMsg}
          placeholder="Olá, {nome}! Bem-vindo(a) à nossa loja."
          rows={3}
          className="bg-[#0b0f19] border-zinc-800 text-zinc-200"
        />
        <p className="text-xs text-zinc-500">
          Enviada quando o cliente digita <span className="font-mono">/start</span>. Use{" "}
          <span className="font-mono text-orange-400">{"{nome}"}</span> para incluir o primeiro nome do cliente automaticamente.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notifyTelegramId" className="text-zinc-300">Notificações de venda</Label>
        <Input
          id="notifyTelegramId"
          name="notifyTelegramId"
          defaultValue={notifyTelegramId}
          placeholder="Seu Telegram ID (ex: 7779385719)"
          className="bg-[#0b0f19] border-zinc-800 text-zinc-200 font-mono"
        />
        <p className="text-xs text-zinc-500">
          Receba uma mensagem no Telegram cada vez que um cliente efetuar uma compra. Para descobrir seu ID, envie{" "}
          <span className="font-mono">/start</span> para{" "}
          <a href="https://t.me/userinfobot" target="_blank" className="text-orange-400 hover:underline">
            @userinfobot
          </a>.
        </p>
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
          Configurações salvas.
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
