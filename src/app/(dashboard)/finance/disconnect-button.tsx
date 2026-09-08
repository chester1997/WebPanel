"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { disconnectMercadoPago } from "@/modules/payments/actions";

export function DisconnectButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() => {
        if (!confirm("Desconectar sua conta do Mercado Pago?")) return;
        startTransition(async () => {
          await disconnectMercadoPago();
        });
      }}
    >
      {pending ? "Desconectando..." : "Desconectar"}
    </Button>
  );
}
