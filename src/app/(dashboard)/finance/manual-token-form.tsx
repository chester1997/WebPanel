"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { connectMercadoPagoManual } from "@/modules/payments/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Testando..." : "Testar e salvar"}
    </Button>
  );
}

export function ManualTokenForm() {
  const [error, setError] = useState("");

  async function clientAction(formData: FormData) {
    const res = await connectMercadoPagoManual(formData);
    setError(res?.error ?? "");
  }

  return (
    <form action={clientAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="accessToken">Access Token</Label>
        <Input
          id="accessToken"
          name="accessToken"
          required
          type="password"
          placeholder="APP_USR-XXXXXXXXXXXXXXXX"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <SubmitButton />
    </form>
  );
}
