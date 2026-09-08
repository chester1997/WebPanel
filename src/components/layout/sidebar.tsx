"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, MessageSquare, ShoppingBag, Users, CreditCard, Settings, AppWindow, BarChart } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Telegram Bots", href: "/bots", icon: MessageSquare },
  { name: "Produtos", href: "/products", icon: ShoppingBag },
  { name: "Conteúdos", href: "/contents", icon: AppWindow },
  { name: "Clientes", href: "/customers", icon: Users },
  { name: "Financeiro", href: "/finance", icon: CreditCard },
  { name: "Marketing", href: "/marketing", icon: BarChart },
  { name: "Configurações", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-zinc-950 border-r border-zinc-800">
      <div className="flex h-16 shrink-0 items-center px-6">
        <h1 className="text-xl font-bold text-white">SaaS Panel</h1>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <nav className="mt-5 flex-1 space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center rounded-md px-3 py-2 text-sm font-medium
                  ${isActive 
                    ? "bg-zinc-800 text-white" 
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  }
                `}
              >
                <item.icon
                  className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${isActive ? "text-white" : "text-zinc-400 group-hover:text-white"}
                  `}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="flex shrink-0 bg-zinc-900 p-4">
        <div className="group block w-full flex-shrink-0">
          <div className="flex items-center">
            <div>
              <div className="inline-block h-9 w-9 rounded-full bg-zinc-700" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Usuário Ativo</p>
              <p className="text-xs font-medium text-zinc-400">Ver perfil</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
