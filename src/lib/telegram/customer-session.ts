import { cookies } from "next/headers";
import { db } from "@/lib/db";

export function storeCustomerCookieName(slug: string): string {
  return `store_customer_${slug}`;
}

/**
 * Resolves the Mini App customer for the current request from the httpOnly
 * cookie set by /api/store/[slug]/session after a validated Telegram
 * initData exchange. Returns null when no customer session exists yet —
 * callers should render a "not identified" state rather than fabricate one.
 */
export async function getStoreCustomer(slug: string, tenantId: string) {
  const cookieStore = await cookies();
  const customerId = cookieStore.get(storeCustomerCookieName(slug))?.value;
  if (!customerId) return null;

  const customer = await db.orm.public.Customer.first({
    id: customerId,
    tenantId,
  });
  return customer;
}
