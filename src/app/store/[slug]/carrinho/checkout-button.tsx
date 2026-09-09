"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkoutCart } from "@/modules/orders/actions";

export function CheckoutButton({ slug, color }: { slug: string; color: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="button"
        disabled={pending}
        className="w-full py-3 rounded-lg text-white font-bold text-sm disabled:opacity-60"
        style={{ backgroundColor: color }}
        onClick={() => {
          setError("");
          startTransition(async () => {
            const res = await checkoutCart(slug);
            if (!res.success) {
              setError(res.error ?? "Erro ao finalizar pedido.");
              return;
            }
            if (res.checkoutUrl) {
              window.location.href = res.checkoutUrl;
            } else {
              router.push(`/store/${slug}/pedido/${res.orderId}`);
            }
          });
        }}
      >
        {pending ? "Processando..." : "Finalizar pedido"}
      </button>
    </div>
  );
}
