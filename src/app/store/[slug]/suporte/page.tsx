import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SupportForm } from "./support-form";

export default async function SupportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tenant = await db.orm.public.Tenant.first({ slug, status: "ACTIVE" });
  if (!tenant) return notFound();

  const settings = await db.orm.public.MiniAppSettings.first({ tenantId: tenant.id });
  const color = settings?.primaryColor || "#f97316";

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold">Suporte</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Precisa de ajuda com um pedido ou acesso? Abra um chamado abaixo.
        </p>
      </div>
      <SupportForm slug={slug} color={color} />
    </div>
  );
}
