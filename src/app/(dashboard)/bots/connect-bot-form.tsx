"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { connectBotAction } from "@/modules/bots/actions";
import { AlertCircle, CheckCircle2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Conectando..." : "Verificar conexão"}
    </Button>
  );
}

export function ConnectBotForm() {
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(
    null
  );

  async function clientAction(formData: FormData) {
    const res = await connectBotAction(formData);
    setResult(res);
  }

  return (
    <form action={clientAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="token">Token do BotFather</Label>
        <Input
          id="token"
          name="token"
          placeholder="1234567890:AAH_XXXXXXXXXXXXX"
          required
          className="font-mono"
        />
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
          Bot conectado e webhook configurado!
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
