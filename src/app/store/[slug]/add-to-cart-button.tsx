"use client";

import { useTransition } from "react";
import { Check, Plus } from "lucide-react";
import { addToCart } from "@/modules/store/cart-actions";
import { cn } from "@/lib/utils";

export function AddToCartButton({
  slug,
  productId,
  color,
  className,
  size = "md",
}: {
  slug: string;
  productId: string;
  color: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const [pending, startTransition] = useTransition();
  const dimension = size === "sm" ? "w-7 h-7" : "w-8 h-8";

  return (
    <button
      type="button"
      disabled={pending}
      className={cn(
        dimension,
        "rounded-md flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 disabled:opacity-60",
        className
      )}
      style={{ backgroundColor: color }}
      onClick={() => startTransition(async () => { await addToCart(slug, productId); })}
      aria-label="Adicionar ao carrinho"
    >
      {pending ? (
        <Check className="w-4 h-4" />
      ) : (
        <Plus className={size === "sm" ? "w-4 h-4" : "w-5 h-5"} />
      )}
    </button>
  );
}
