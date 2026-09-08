import { CreditCard } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser, requireTenant } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ManualTokenForm } from "./manual-token-form";
import { DisconnectButton } from "./disconnect-button";

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ mp_connected?: string; mp_error?: string }>;
}) {
  const user = await requireUser();
  const { tenant } = await requireTenant(user.id);
  const { mp_connected, mp_error } = await searchParams;

  const connection = await db.orm.public.PaymentGatewayConnection.first({
    tenantId: tenant.id,
    gateway: "MERCADO_PAGO",
  });
  const isConnected = Boolean(connection?.isActive);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Financeiro</h2>
        <p className="text-zinc-400">
          Gerencie seus gateways de pagamento e recebimentos.
        </p>
      </div>

      {mp_connected && (
        <div className="text-sm text-emerald-500 bg-emerald-500/10 p-3 rounded-md border border-emerald-500/20">
          Conta do Mercado Pago conectada com sucesso.
        </div>
      )}
      {mp_error && (
        <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-md border border-red-500/20">
          Não foi possível conectar sua conta do Mercado Pago ({mp_error}).
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-500" />
              Mercado Pago
            </CardTitle>
            <CardDescription>
              Conecte sua conta para receber pagamentos via PIX e cartão
              diretamente na sua Mini App.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isConnected ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm text-emerald-500 bg-emerald-500/10 p-3 rounded-md border border-emerald-500/20">
                  🟢 Conectado
                </div>
                <DisconnectButton />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 p-3 rounded-md border border-red-500/20">
                  🔴 Não conectado
                </div>

                <a href="/api/mercadopago/authorize">
                  <Button className="w-full">Conectar minha conta</Button>
                </a>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-zinc-900 px-2 text-zinc-500">
                      ou inserir token manualmente
                    </span>
                  </div>
                </div>

                <ManualTokenForm />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
