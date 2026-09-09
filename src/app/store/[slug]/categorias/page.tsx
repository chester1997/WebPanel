import { notFound } from "next/navigation";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { db } from "@/lib/db";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tenant = await db.orm.public.Tenant.first({ slug, status: "ACTIVE" });
  if (!tenant) return notFound();

  const settings = await db.orm.public.MiniAppSettings.first({ tenantId: tenant.id });
  const color = settings?.primaryColor || "#f97316";

  const [categories, products] = await Promise.all([
    db.orm.public.Category.where({ tenantId: tenant.id }).all(),
    db.orm.public.Product.where({ tenantId: tenant.id, status: "ACTIVE" }).all(),
  ]);

  const countByCategory = new Map<string, number>();
  for (const p of products) {
    if (!p.categoryId) continue;
    countByCategory.set(p.categoryId, (countByCategory.get(p.categoryId) ?? 0) + 1);
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <h1 className="text-lg font-bold">Categorias</h1>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <LayoutGrid className="w-10 h-10 text-zinc-600" />
          <p className="text-zinc-400 text-sm">Esta loja ainda não tem categorias.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/store/${slug}?categoria=${cat.id}`}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1 hover:border-zinc-700"
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white mb-1"
                style={{ backgroundColor: color }}
              >
                {cat.name.charAt(0).toUpperCase()}
              </span>
              <span className="text-sm font-medium text-white">{cat.name}</span>
              <span className="text-xs text-zinc-500">
                {countByCategory.get(cat.id) ?? 0} produto{(countByCategory.get(cat.id) ?? 0) !== 1 ? "s" : ""}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
