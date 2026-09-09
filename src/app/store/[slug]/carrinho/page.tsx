import { notFound } from "next/navigation";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { db } from "@/lib/db";
import { getCart } from "@/lib/store/cart";
import { getStoreCustomer } from "@/lib/telegram/customer-session";
import { CartItemControls } from "./cart-item-controls";
import { CheckoutButton } from "./checkout-button";

export default async function CartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tenant = await db.orm.public.Tenant.first({ slug, status: "ACTIVE" });
  if (!tenant) return notFound();

  const settings = await db.orm.public.MiniAppSettings.first({ tenantId: tenant.id });
  const color = settings?.primaryColor || "#f97316";

  const cart = await getCart(slug);
  const customer = await getStoreCustomer(slug, tenant.id);

  const productIds = cart.map((i) => i.productId);
  const products =
    productIds.length > 0
      ? await db.orm.public.Product.where((p) => p.id.in(productIds)).all()
      : [];
  const prices =
    productIds.length > 0
      ? await db.orm.public.ProductPrice.where((p) => p.productId.in(productIds)).all()
      : [];

  const productById = new Map(products.map((p) => [p.id, p]));
  const priceByProduct = new Map<string, number>();
  for (const price of prices) {
    if (!priceByProduct.has(price.productId)) {
      priceByProduct.set(price.productId, price.promotionalPrice ?? price.price);
    }
  }

  const items = cart
    .map((item) => {
      const product = productById.get(item.productId);
      const unitPrice = priceByProduct.get(item.productId) ?? 0;
      if (!product) return null;
      return { ...item, product, unitPrice };
    })
    .filter((i): i is NonNullable<typeof i> => i !== null);

  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <div className="px-4 py-6 space-y-6">
      <h1 className="text-lg font-bold">Carrinho</h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <ShoppingCart className="w-10 h-10 text-zinc-600" />
          <p className="text-zinc-400 text-sm">Seu carrinho está vazio.</p>
          <Link href={`/store/${slug}`} className="text-sm font-semibold" style={{ color }}>
            Ver catálogo
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.productId}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.product.title}</p>
                  <p className="text-xs text-green-400">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                      item.unitPrice
                    )}
                  </p>
                </div>
                <CartItemControls
                  slug={slug}
                  productId={item.productId}
                  quantity={item.quantity}
                  color={color}
                />
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-800 pt-4 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Total</span>
              <span className="text-lg font-bold text-white">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(total)}
              </span>
            </div>

            {!customer && (
              <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                Abra esta loja pelo Mini App do Telegram para finalizar a compra — assim conseguimos
                entregar seu produto automaticamente após o pagamento.
              </p>
            )}

            <CheckoutButton slug={slug} color={color} />
          </div>
        </>
      )}
    </div>
  );
}
