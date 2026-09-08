import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tag } from "lucide-react"

const getTenantId = () => "cl_fake_tenant_id" 

export default async function MarketingPage() {
  const tenantId = getTenantId()
  
  const coupons = await db.coupon.findMany({
    where: { tenantId },
    orderBy: { expiresAt: "desc" }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Marketing e Cupons</h2>
          <p className="text-zinc-400">Crie ofertas e cupons para alavancar suas vendas no Telegram.</p>
        </div>
      </div>
      
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-500" />
            Meus Cupons
          </CardTitle>
          <CardDescription className="text-zinc-400">Cupons de desconto ativos para os clientes usarem no checkout.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-zinc-300">
              <thead className="text-xs uppercase bg-zinc-950 text-zinc-400">
                <tr>
                  <th className="px-4 py-3 rounded-tl-md">Código</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Usos</th>
                  <th className="px-4 py-3">Validade</th>
                  <th className="px-4 py-3 rounded-tr-md">Status</th>
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Nenhum cupom cadastrado.</td>
                  </tr>
                )}
                {coupons.map(coupon => (
                  <tr key={coupon.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-400">{coupon.code}</td>
                    <td className="px-4 py-3">{coupon.type}</td>
                    <td className="px-4 py-3">{coupon.value}{coupon.type === "PERCENTAGE" ? "%" : "R$"}</td>
                    <td className="px-4 py-3">{coupon.usageCount} / {coupon.usageLimit || "∞"}</td>
                    <td className="px-4 py-3">{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : "Sem validade"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${coupon.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-500/10 text-zinc-400"}`}>
                        {coupon.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
