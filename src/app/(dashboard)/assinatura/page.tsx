import { Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser, requireTenant } from "@/lib/auth/session";
import { db } from "@/lib/db";

export default async function SubscriptionPage() {
  const user = await requireUser();
  const { tenant } = await requireTenant(user.id);

  const [subscription, plans] = await Promise.all([
    db.orm.public.PlatformSubscription.first({ tenantId: tenant.id }),
    db.orm.public.Plan.where({ isActive: true }).all(),
  ]);

  const currentPlan = subscription
    ? await db.orm.public.Plan.first({ id: subscription.planId })
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Assinatura</h2>
        <p className="text-zinc-400">Seu plano na plataforma.</p>
      </div>

      <Card className="bg-[#11131e] border-zinc-800/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-orange-500" />
            Plano atual
          </CardTitle>
          <CardDescription>
            {subscription
              ? `Status: ${subscription.status}`
              : "Você ainda não tem uma assinatura ativa na plataforma."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentPlan ? (
            <div>
              <p className="text-xl font-bold text-white">{currentPlan.name}</p>
              <p className="text-sm text-zinc-400">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: currentPlan.currency,
                }).format(currentPlan.price)}
                /mês
              </p>
              {subscription?.expiresAt && (
                <p className="text-xs text-zinc-500 mt-2">
                  Renova/expira em{" "}
                  {new Date(subscription.expiresAt).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Nenhum plano ativo no momento.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="bg-[#11131e] border-zinc-800/50">
            <CardHeader>
              <CardTitle className="text-white">{plan.name}</CardTitle>
              <p className="text-2xl font-bold text-white">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: plan.currency,
                }).format(plan.price)}
                <span className="text-sm text-zinc-500 font-normal">/mês</span>
              </p>
            </CardHeader>
          </Card>
        ))}
        {plans.length === 0 && (
          <p className="text-sm text-zinc-500 col-span-full">
            Nenhum plano cadastrado pela plataforma ainda.
          </p>
        )}
      </div>
    </div>
  );
}
