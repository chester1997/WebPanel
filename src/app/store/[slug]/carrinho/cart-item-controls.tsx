"use client";

import { useTransition } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { setCartItemQuantity, removeFromCart } from "@/modules/store/cart-actions";

export function CartItemControls({
  slug,
  productId,
  quantity,
  color,
}: {
  slug: string;
  productId: string;
  quantity: number;
  color: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        className="w-7 h-7 rounded-md border border-zinc-700 flex items-center justify-center text-zinc-300 disabled:opacity-50"
        onClick={() =>
          startTransition(async () => { await setCartItemQuantity(slug, productId, quantity - 1); })
        }
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="text-sm font-medium w-4 text-center">{quantity}</span>
      <button
        type="button"
        disabled={pending}
        className="w-7 h-7 rounded-md flex items-center justify-center text-white disabled:opacity-50"
        style={{ backgroundColor: color }}
        onClick={() =>
          startTransition(async () => { await setCartItemQuantity(slug, productId, quantity + 1); })
        }
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        disabled={pending}
        className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-red-500 disabled:opacity-50"
        onClick={() => startTransition(async () => { await removeFromCart(slug, productId); })}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
