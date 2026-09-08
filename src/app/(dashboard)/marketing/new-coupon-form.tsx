"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createCoupon } from "@/modules/marketing/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Criando..." : "Criar cupom"}
    </Button>
  );
}

export function NewCouponForm() {
  const [error, setError] = useState("");

  async function clientAction(formData: FormData) {
    const res = await createCoupon(formData);
    setError(res?.error ?? "");
  }

  return (
    <form action={clientAction} className="flex flex-wrap items-end gap-3">
      <div className="space-y-2">
        <Label htmlFor="code">Código</Label>
        <Input id="code" name="code" placeholder="BEMVINDO10" required className="w-40" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <select
          id="type"
          name="type"
          className="flex h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white"
        >
          <option value="PERCENTAGE">Percentual</option>
          <option value="FIXED">Valor fixo</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="value">Valor</Label>
        <Input
          id="value"
          name="value"
          type="number"
          step="0.01"
          min="0"
          required
          className="w-28"
        />
      </div>
      <SubmitButton />
      {error && <p className="text-sm text-red-500 basis-full">{error}</p>}
    </form>
  );
}
