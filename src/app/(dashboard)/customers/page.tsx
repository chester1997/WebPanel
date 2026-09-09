import Link from "next/link"
import { requireUser, requireTenant } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BanCustomerButton } from "./ban-customer-button"

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const user = await requireUser()
  const { tenant } = await requireTenant(user.id)
  const { tab } = await searchParams
  const showBanned = tab === "banned"

  const allCustomers = await db.orm.public.Customer.where({ tenantId: tenant.id }).all()
  const activeCustomers = allCustomers.filter((c) => c.status !== "BANNED")
  const bannedCustomers = allCustomers.filter((c) => c.status === "BANNED")
  const customers = showBanned ? bannedCustomers : activeCustomers

  // Buscar CustomerAccess
  const customerIds = customers.map(c => c.id)
  const accesses = customerIds.length > 0
    ? await db.orm.public.CustomerAccess.where(a => a.customerId.in(customerIds)).all()
    : []

  const productIds = accesses.map(a => a.productId)
  const products = productIds.length > 0
    ? await db.orm.public.Product.where(p => p.id.in(productIds)).all()
    : []

  const productsMap = new Map(products.map(p => [p.id, p]))

  const accessesByCustomer = new Map<string, typeof accesses>()
  for(const acc of accesses) {
    const list = accessesByCustomer.get(acc.customerId) ?? []
    list.push(acc)
    accessesByCustomer.set(acc.customerId, list)
  }

  // Sort
  customers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Clientes e Acessos</h2>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Gerenciamento de Clientes</CardTitle>
          <CardDescription className="text-zinc-400">Lista de clientes que interagiram com sua loja ou compraram produtos.</CardDescription>
          <div className="flex gap-2 pt-2">
            <Link
              href="/customers"
              className={`text-sm px-3 py-1.5 rounded-md font-medium ${!showBanned ? "bg-orange-500/15 text-orange-400" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              Ativos ({activeCustomers.length})
            </Link>
            <Link
              href="/customers?tab=banned"
              className={`text-sm px-3 py-1.5 rounded-md font-medium ${showBanned ? "bg-orange-500/15 text-orange-400" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              Banidos ({bannedCustomers.length})
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customers.length === 0 && (
              <div className="col-span-full py-8 text-center text-zinc-500">
                {showBanned ? "Nenhum cliente banido." : "Nenhum cliente cadastrado."}
              </div>
            )}
            {customers.map(customer => {
              const myAccesses = accessesByCustomer.get(customer.id) || []

              return (
                <div key={customer.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-300">
                      {(customer.name || customer.telegramUsername || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-white truncate">{customer.name || "Sem nome"}</h3>
                      <p className="text-xs text-zinc-400 truncate">@{customer.telegramUsername || "desconhecido"} · {customer.telegramId}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase">Acessos Ativos</h4>
                    {myAccesses.length === 0 ? (
                      <p className="text-xs text-zinc-600">Nenhum acesso ativo</p>
                    ) : (
                      myAccesses.map((acc) => (
                        <div key={acc.id} className="flex justify-between items-center text-xs p-2 bg-zinc-900 rounded-md">
                          <span className="text-zinc-300 truncate pr-2">{productsMap.get(acc.productId)?.title}</span>
                          <span className={`font-medium ${acc.status === 'ACTIVE' ? 'text-emerald-500' : 'text-zinc-500'}`}>{acc.status}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/70">
                    <BanCustomerButton customerId={customer.id} banned={customer.status === "BANNED"} />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
