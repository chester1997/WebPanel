import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { ChevronLeft, Lock, Play } from "lucide-react";
import { getStoreCustomer } from "@/lib/telegram/customer-session";

export default async function PlayerMiniApp({
  params,
}: {
  params: Promise<{ slug: string; contentId: string }>;
}) {
  // `contentId` na rota é o id do Product que dá acesso ao conteúdo — mantido
  // como nome de rota para casar com o link em /meus-acessos.
  const { slug, contentId: productId } = await params;

  const tenant = await db.orm.public.Tenant.first({ slug, status: "ACTIVE" });
  if (!tenant) return notFound();

  const product = await db.orm.public.Product.first({
    id: productId,
    tenantId: tenant.id,
  });
  if (!product) return notFound();

  const customer = await getStoreCustomer(slug, tenant.id);
  const access = customer
    ? await db.orm.public.CustomerAccess.first({
        customerId: customer.id,
        productId,
        status: "ACTIVE",
      })
    : null;

  if (!access) {
    return (
      <div className="h-screen w-full bg-black text-white flex flex-col items-center justify-center gap-4 p-6 text-center">
        <Lock className="w-12 h-12 text-zinc-600" />
        <p className="text-zinc-400">
          Você não tem acesso liberado a este conteúdo.
        </p>
        <Link href={`/store/${slug}`} className="text-blue-500 font-semibold">
          Ver catálogo
        </Link>
      </div>
    );
  }

  const contentId =
    product.deliveryType === "MINI_APP_CONTENT" ? product.deliveryContent : null;
  const content = contentId
    ? await db.orm.public.Content.first({ id: contentId, tenantId: tenant.id })
    : null;

  const media = content
    ? await db.orm.public.Media.first({ contentId: content.id })
    : null;

  const seasons = content
    ? await db.orm.public.Season.where({ contentId: content.id }).all()
    : [];
  const episodes =
    seasons.length > 0
      ? await db.orm.public.Episode.where((e) =>
          e.seasonId.in(seasons.map((s) => s.id))
        ).all()
      : [];

  const title = content?.title ?? product.title;
  const description = content?.description ?? product.description ?? "";

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
      <div className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
        <Link
          href={`/store/${slug}/meus-acessos`}
          className="p-2 bg-black/40 rounded-full backdrop-blur-md"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </Link>
        <span className="text-xs font-medium text-zinc-300">{title}</span>
        <div className="w-9" />
      </div>

      <div className="relative flex-1 bg-zinc-900 flex items-center justify-center">
        {media?.videoUrl ? (
          <video
            className="w-full h-full object-contain"
            src={media.videoUrl}
            controls
            playsInline
          />
        ) : (
          <div className="text-center space-y-3 px-6">
            <Play className="w-12 h-12 text-zinc-600 mx-auto" />
            <p className="text-sm font-medium text-zinc-400">
              {media?.telegramFileId
                ? "Este conteúdo é entregue pelo bot do Telegram."
                : "Vídeo ainda não configurado para este conteúdo."}
            </p>
          </div>
        )}
      </div>

      <div className="h-1/3 min-h-[250px] bg-zinc-950 p-5 overflow-y-auto">
        <h1 className="text-xl font-bold mb-1">{title}</h1>
        {description && (
          <p className="text-sm text-zinc-400 leading-relaxed mb-6">
            {description}
          </p>
        )}

        {episodes.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Episódios</h3>
            {episodes.map((ep) => (
              <div key={ep.id} className="flex gap-3 items-center">
                <div className="w-24 h-16 bg-zinc-800 rounded-md shrink-0 flex items-center justify-center">
                  <Play className="w-4 h-4 text-zinc-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">{ep.title}</h4>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
