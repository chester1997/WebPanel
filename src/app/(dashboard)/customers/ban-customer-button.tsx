"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Ban, UserCheck } from "lucide-react";
import { setCustomerBanStatus } from "@/modules/customers/actions";

export function BanCustomerButton({
  customerId,
  banned,
}: {
  customerId: string;
  banned: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(() => {
          void setCustomerBanStatus(customerId, !banned);
        })
      }
      className={
        banned
          ? "w-full bg-transparent border-emerald-800 text-emerald-400 hover:bg-emerald-500/10"
          : "w-full bg-transparent border-red-900 text-red-400 hover:bg-red-500/10"
      }
    >
      {banned ? (
        <>
          <UserCheck className="w-4 h-4 mr-2" /> Desbanir
        </>
      ) : (
        <>
          <Ban className="w-4 h-4 mr-2" /> Banir
        </>
      )}
    </Button>
  );
}
