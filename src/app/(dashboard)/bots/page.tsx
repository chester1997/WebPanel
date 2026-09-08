import { MessageSquare } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser, requireTenant } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ConnectBotForm } from "./connect-bot-form";
import { RemoveBotButton } from "./remove-bot-button";

export default async function BotsPage() {
  const user = await requireUser();
  const { tenant } = await requireTenant(user.id);

  const bots = await db.orm.public.Bot.where({ tenantId: tenant.id }).all();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Telegram Bots</h2>
        <p className="text-zinc-400">
          Gerencie a conexão da sua loja com o Telegram.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Adicionar bot
            </CardTitle>
            <CardDescription>
              Cole o token gerado pelo BotFather no Telegram.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectBotForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Bots conectados</CardTitle>
            <CardDescription>
              Bots atualmente vinculados à sua loja.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {bots.length === 0 && (
              <div className="text-center py-8 text-sm text-zinc-500">
                Nenhum bot conectado ainda.
              </div>
            )}
            {bots.map((bot) => (
              <div
                key={bot.id}
                className="flex items-center justify-between p-4 border border-zinc-800 rounded-lg bg-zinc-950"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                    {bot.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{bot.name}</p>
                    <p className="text-xs text-zinc-400">@{bot.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {bot.status === "ACTIVE" ? "Conectado" : bot.status}
                  </span>
                  <RemoveBotButton botId={bot.id} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
