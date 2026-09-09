"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  MessageSquare, 
  ShoppingBag, 
  Trophy, 
  Users, 
  CreditCard, 
  Globe, 
  BellRing,
  Bot,
  Megaphone,
  HandHeart,
  Star,
  Settings,
  AppWindow,
  Tag,
  ClipboardList
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Bot Telegram", href: "/bots", icon: MessageSquare },
  { name: "Produtos", href: "/products", icon: ShoppingBag },
  { name: "Categorias", href: "/categories", icon: Tag },
  { name: "Conteúdos", href: "/contents", icon: AppWindow },
  { name: "Ranking Top 10", href: "#", icon: Trophy, badge: "Business" },
  { name: "Clientes", href: "/customers", icon: Users },
  { name: "Pedidos", href: "/orders", icon: ClipboardList },
  { name: "Financeiro", href: "/finance", icon: CreditCard },
  { name: "Loja Online", href: "#", icon: Globe, badge: "Pro" },
  { name: "Cobrança", href: "#", icon: BellRing },
  { name: "Assistente IA", href: "#", icon: Bot, badge: "Business" },
  { name: "Marketing", href: "/marketing", icon: Megaphone, badge: "Pro" },
  { name: "Boas-vindas", href: "#", icon: HandHeart },
  { name: "Assinatura", href: "#", icon: Star },
  { name: "Configurações", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-[#11131e] border-r border-[#1f2235]">
      <div className="flex h-20 shrink-0 flex-col justify-center px-6 border-b border-[#1f2235]/50">
        <h1 className="text-2xl font-black text-white tracking-wide">Webi</h1>
        <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Painel do Vendedor</p>
      </div>
      
      <div className="flex flex-1 flex-col overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-[#1f2235] scrollbar-track-transparent">
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = item.href !== "#" && pathname.startsWith(item.href)
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center justify-between px-6 py-3 text-sm font-medium transition-all relative
                  ${isActive
                    ? "text-orange-500 bg-orange-500/10"
                    : "text-zinc-400 hover:bg-[#1f2235]/50 hover:text-zinc-200"
                  }
                `}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-r-md" />
                )}
                
                <div className="flex items-center">
                  <item.icon
                    className={`
                      mr-3 h-4 w-4 flex-shrink-0 transition-colors
                      ${isActive ? "text-orange-500" : "text-zinc-500 group-hover:text-zinc-400"}
                    `}
                    aria-hidden="true"
                  />
                  {item.name}
                </div>

                {item.badge && (
                  <span className="text-[9px] text-zinc-600 uppercase font-semibold">
                    Apenas no {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
      
      {/* Footer Profile Area */}
      <div className="p-4 border-t border-[#1f2235] bg-[#11131e]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-xs font-bold">
            AD
          </div>
          <div>
            <p className="text-xs font-bold text-white">Admin</p>
            <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded uppercase font-bold">
              TRIAL
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
