"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCart, saveCart } from "@/lib/store/cart";

export async function addToCart(slug: string, productId: string) {
  const product = await db.orm.public.Product.first({ id: productId, status: "ACTIVE" });
  if (!product) return { error: "Produto indisponível" };

  const cart = await getCart(slug);
  const existing = cart.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ productId, quantity: 1 });
  }
  await saveCart(slug, cart);
  revalidatePath(`/store/${slug}`);
  revalidatePath(`/store/${slug}/carrinho`);
  return { success: true, count: cart.reduce((sum, i) => sum + i.quantity, 0) };
}

export async function setCartItemQuantity(slug: string, productId: string, quantity: number) {
  const cart = await getCart(slug);
  const next =
    quantity <= 0
      ? cart.filter((i) => i.productId !== productId)
      : cart.map((i) => (i.productId === productId ? { ...i, quantity } : i));
  await saveCart(slug, next);
  revalidatePath(`/store/${slug}/carrinho`);
  return { success: true };
}

export async function removeFromCart(slug: string, productId: string) {
  return setCartItemQuantity(slug, productId, 0);
}
