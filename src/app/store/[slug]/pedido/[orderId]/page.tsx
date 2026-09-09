import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { db } from "@/lib/db";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Aguardando pagamento",
  PAID: "Pagamento aprovado",
  FAILED: "Pagamento recusado",
  CANCELLED: "Pedido cancelado",
  REFUNDED: "Pedido reembolsado",
  EXPIRED: "Pedido expirado",
};

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>;
}) {
  const { slug, orderId } = await params;

  const tenant = await db.orm.public.Tenant.first({ slug, status: "ACTIVE" });
  if (!tenant) return notFound();

  const order = await db.orm.public.Order.first({ id: orderId, tenantId: tenant.id });
  if (!order) return notFound();

  const items = await db.orm.public.OrderItem.where({ orderId: order.id }).all();
  const productIds = items.map((i) => i.productId);
  const products =
    productIds.length > 0
      ? await db.orm.public.Product.where((p) => p.id.in(productIds)).all()
      : [];
  const productById = new Map(products.map((p) => [p.id, p]));

  const isPaid = order.status === "PAID";
  const isFailed = ["FAILED", "CANCELLED", "REFUNDED", "EXPIRED"].includes(order.status);

  return (
    <div className="px-4 py-10 flex flex-col items-center text-center gap-4">
      {isPaid ? (
        <CheckCircle2 className="w-14 h-14 text-emerald-500" />
      ) : isFailed ? (
        <XCircle className="w-14 h-14 text-red-500" />
      ) : (
        <Clock className="w-14 h-14 text-amber-400" />
      )}

      <h1 className="text-lg font-bold">{STATUS_LABEL[order.status] ?? order.status}</h1>

      <p className="text-sm text-zinc-400 max-w-xs">
        {isPaid
          ? "Seu acesso já foi liberado. Confira em Meus Acessos."
          : isFailed
            ? "Não foi possível confirmar o pagamento deste pedido."
            : "Assim que o pagamento for confirmado, seu acesso é liberado automaticamente."}
      </p>

      <div className="w-full max-w-xs bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-left space-y-2 mt-4">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-zinc-300 truncate pr-2">
              {productById.get(item.productId)?.title ?? "Produto"} x{item.quantity}
            </span>
            <span className="text-zinc-400">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                item.price * item.quantity
              )}
            </span>
          </div>
        ))}
        <div className="border-t border-zinc-800 pt-2 flex justify-between text-sm font-bold text-white">
          <span>Total</span>
          <span>
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: order.currency }).format(
              order.totalAmount
            )}
          </span>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <Link
          href={`/store/${slug}/meus-acessos`}
          className="text-sm font-semibold text-blue-400"
        >
          Meus acessos
        </Link>
        <Link href={`/store/${slug}`} className="text-sm font-semibold text-zinc-400">
          Voltar à loja
        </Link>
      </div>
    </div>
  );
}
