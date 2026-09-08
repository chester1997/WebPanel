"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { removeBotAction } from "@/modules/bots/actions";

export function RemoveBotButton({ botId }: { botId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Remover este bot da loja?")) return;
        startTransition(async () => {
          await removeBotAction(botId);
        });
      }}
    >
      {pending ? "Removendo..." : "Remover"}
    </Button>
  );
}
