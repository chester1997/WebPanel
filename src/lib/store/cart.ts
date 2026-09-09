import { cookies } from "next/headers";

export interface CartItem {
  productId: string;
  quantity: number;
}

function cartCookieName(slug: string): string {
  return `cart_${slug}`;
}

export async function getCart(slug: string): Promise<CartItem[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(cartCookieName(slug))?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        typeof item?.productId === "string" && typeof item?.quantity === "number"
    );
  } catch {
    return [];
  }
}

export async function saveCart(slug: string, items: CartItem[]): Promise<void> {
  const cookieStore = await cookies();
  if (items.length === 0) {
    cookieStore.delete(cartCookieName(slug));
    return;
  }
  cookieStore.set(cartCookieName(slug), JSON.stringify(items), {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: `/store/${slug}`,
    maxAge: 60 * 60 * 24 * 7,
  });
}
