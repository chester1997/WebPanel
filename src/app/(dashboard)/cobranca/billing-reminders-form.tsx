"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateBillingReminderSettingsAction } from "@/modules/billing/actions";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { DEFAULT_BILLING_REMINDERS } from "@/modules/billing/defaults";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-orange-500 hover:bg-orange-600 text-white">
      {pending ? "Salvando..." : "Salvar mensagens"}
    </Button>
  );
}

export function BillingRemindersForm({
  settings,
}: {
  settings: typeof DEFAULT_BILLING_REMINDERS;
}) {
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null);
  const [pixActive, setPixActive] = useState(settings.pixReminderActive);
  const [planActive, setPlanActive] = useState(settings.planReminderActive);

  async function clientAction(formData: FormData) {
    const res = await updateBillingReminderSettingsAction(formData);
    setResult(res);
  }

  return (
    <form action={clientAction} className="space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-[#11131e] p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-white text-sm">⚡ Lembrete de PIX não pago</h3>
          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              name="pixReminderActive"
              defaultChecked={pixActive}
              onChange={(e) => setPixActive(e.target.checked)}
              className="accent-orange-500"
            />
            Ativar
          </label>
        </div>
        <p className="text-xs text-zinc-500 mb-4">Quando o cliente gera um PIX mas não paga, o bot envia mensagens automaticamente.</p>

        <div className="space-y-3">
          <div>
            <Label className="text-zinc-300 text-xs">Mensagem aos 5 minutos</Label>
            <Textarea name="pixMsg5" defaultValue={settings.pixMsg5} rows={2} className="mt-1 bg-[#0b0f19] border-zinc-800 text-zinc-200" />
          </div>
          <div>
            <Label className="text-zinc-300 text-xs">Mensagem aos 7 minutos</Label>
            <Textarea name="pixMsg7" defaultValue={settings.pixMsg7} rows={2} className="mt-1 bg-[#0b0f19] border-zinc-800 text-zinc-200" />
          </div>
          <div>
            <Label className="text-zinc-300 text-xs">Mensagem aos 10 minutos</Label>
            <Textarea name="pixMsg10" defaultValue={settings.pixMsg10} rows={2} className="mt-1 bg-[#0b0f19] border-zinc-800 text-zinc-200" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-[#11131e] p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-white text-sm">🔔 Lembrete de vencimento de plano</h3>
          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              name="planReminderActive"
              defaultChecked={planActive}
              onChange={(e) => setPlanActive(e.target.checked)}
              className="accent-orange-500"
            />
            Ativar
          </label>
        </div>
        <p className="text-xs text-zinc-500 mb-4">Enviadas automaticamente pelo bot antes do plano do cliente expirar.</p>

        <div className="space-y-3">
          <div>
            <Label className="text-zinc-300 text-xs">3 dias antes do vencimento</Label>
            <Textarea name="planMsg3d" defaultValue={settings.planMsg3d} rows={2} className="mt-1 bg-[#0b0f19] border-zinc-800 text-zinc-200" />
          </div>
          <div>
            <Label className="text-zinc-300 text-xs">1 dia antes do vencimento</Label>
            <Textarea name="planMsg1d" defaultValue={settings.planMsg1d} rows={2} className="mt-1 bg-[#0b0f19] border-zinc-800 text-zinc-200" />
          </div>
          <div>
            <Label className="text-zinc-300 text-xs">Ao expirar</Label>
            <Textarea name="planMsgExpired" defaultValue={settings.planMsgExpired} rows={2} className="mt-1 bg-[#0b0f19] border-zinc-800 text-zinc-200" />
          </div>
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
          Mensagens salvas.
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
