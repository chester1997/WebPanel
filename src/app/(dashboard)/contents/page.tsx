import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppWindow, Video, ListVideo } from "lucide-react";
import { requireUser, requireTenant } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { NewContentForm } from "./new-content-form";

export default async function ContentsPage() {
  const user = await requireUser();
  const { tenant } = await requireTenant(user.id);

  const contents = await db.orm.public.Content.where({
    tenantId: tenant.id,
  }).all();

  const contentIds = contents.map((c) => c.id);
  const seasons =
    contentIds.length > 0
      ? await db.orm.public.Season.where((s) => s.contentId.in(contentIds)).all()
      : [];
  const seasonIds = seasons.map((s) => s.id);
  const episodes =
    seasonIds.length > 0
      ? await db.orm.public.Episode.where((e) => e.seasonId.in(seasonIds)).all()
      : [];

  const seasonsByContent = new Map<string, number>();
  for (const s of seasons) {
    seasonsByContent.set(s.contentId, (seasonsByContent.get(s.contentId) ?? 0) + 1);
  }
  const episodesBySeason = new Map<string, number>();
  for (const e of episodes) {
    episodesBySeason.set(e.seasonId, (episodesBySeason.get(e.seasonId) ?? 0) + 1);
  }
  const episodesByContent = new Map<string, number>();
  for (const s of seasons) {
    const count = episodesBySeason.get(s.id) ?? 0;
    episodesByContent.set(s.contentId, (episodesByContent.get(s.contentId) ?? 0) + count);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Conteúdos Digitais</h2>
          <p className="text-zinc-400">
            Gerencie filmes, séries e cursos que os clientes acessam na Mini App.
          </p>
        </div>
        <NewContentForm />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contents.length === 0 && (
          <div className="col-span-full py-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/50">
            <AppWindow className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-zinc-300">
              Nenhum conteúdo cadastrado
            </h3>
            <p className="text-zinc-500 text-sm">
              Cadastre seu primeiro vídeo ou série.
            </p>
          </div>
        )}

        {contents.map((content) => (
          <Card key={content.id} className="flex flex-col">
            <div className="h-32 bg-zinc-800 rounded-t-xl" />
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base leading-tight flex items-center gap-2">
                {content.type === "SERIES" ? (
                  <ListVideo className="w-4 h-4 text-blue-500" />
                ) : (
                  <Video className="w-4 h-4 text-amber-500" />
                )}
                {content.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="mt-auto">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                <span className="bg-zinc-800 px-2 py-1 rounded">{content.type}</span>
                {content.type === "SERIES" && (
                  <span>
                    {seasonsByContent.get(content.id) ?? 0} temp. /{" "}
                    {episodesByContent.get(content.id) ?? 0} eps.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
