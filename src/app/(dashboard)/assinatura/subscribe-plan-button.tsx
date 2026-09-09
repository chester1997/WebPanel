"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createPlatformCheckoutAction } from "@/modules/tenants/billing-actions";
import { AlertCircle } from "lucide-react";

export function SubscribePlanButton({ planId, label }: { planId: string; label: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const res = await createPlatformCheckoutAction(planId);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
      >
        {isPending ? "Gerando cobrança..." : label}
      </Button>
      {error && (
        <div className="flex items-start gap-2 text-xs text-red-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {error}
        </div>
      )}
    </div>
  );
}
