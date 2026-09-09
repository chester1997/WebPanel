import { requireUser, requireTenant } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { BillingRemindersForm } from "./billing-reminders-form";
import { DEFAULT_BILLING_REMINDERS } from "@/modules/billing/defaults";

export default async function CobrancaPage() {
  const user = await requireUser();
  const { tenant } = await requireTenant(user.id);

  const settings = await db.orm.public.BillingReminderSettings.first({ tenantId: tenant.id });

  const values = settings
    ? {
        pixReminderActive: settings.pixReminderActive,
        pixMsg5: settings.pixMsg5,
        pixMsg7: settings.pixMsg7,
        pixMsg10: settings.pixMsg10,
        planReminderActive: settings.planReminderActive,
        planMsg3d: settings.planMsg3d,
        planMsg1d: settings.planMsg1d,
        planMsgExpired: settings.planMsgExpired,
      }
    : DEFAULT_BILLING_REMINDERS;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Cobrança Automática</h2>
        <p className="text-zinc-400">Mensagens enviadas pelo bot para lembrar clientes.</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-[#11131e] p-4 text-xs text-zinc-400">
        <span className="font-semibold text-zinc-300">Variáveis disponíveis:</span>{" "}
        <span className="font-mono text-orange-400">{"{nome}"}</span> Nome do cliente ·{" "}
        <span className="font-mono text-orange-400">{"{produto}"}</span> Nome do produto ·{" "}
        <span className="font-mono text-orange-400">{"{vencimento}"}</span> Data de vencimento
      </div>

      <BillingRemindersForm settings={values} />
    </div>
  );
}
