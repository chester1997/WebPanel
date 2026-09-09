import { ReactNode } from "react"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Menu, Search, Home, LayoutGrid, ShoppingCart, PlaySquare, Headset } from "lucide-react"
import Link from "next/link"

export default async function StoreLayout({ 
  children, 
  params 
}: { 
  children: ReactNode, 
  params: { slug: string } 
}) {
  const { slug } = params

  const tenant = await db.orm.public.Tenant.first({ slug })
  if (!tenant) return notFound()

  const settings = await db.orm.public.MiniAppSettings.first({ tenantId: tenant.id })
  
  // A cor primária será forçada para laranja conforme o pedido, caso não esteja definida
  const primaryColor = settings?.primaryColor || "#f97316" // orange-500
  const botUsername = "@" + (tenant.name.toLowerCase().replace(/\s+/g, '') + "bot") // Fallback caso não tenha bot vinculado

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans flex flex-col mx-auto max-w-md relative pb-16 shadow-2xl">
      
      {/* Header Mobile / Mini App */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[#0f172a]/90 backdrop-blur-md border-b border-zinc-800">
        <button className="text-zinc-300 p-1">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs" style={{ backgroundColor: primaryColor }}>
            {tenant.name.charAt(0)}
          </div>
          <h1 className="text-sm font-bold tracking-tight uppercase">APP {tenant.name}</h1>
        </div>
        <button className="text-zinc-300 p-1">
          <Search className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
      
      {/* TabBar */}
      <nav className="fixed bottom-0 w-full max-w-md bg-[#0f172a] border-t border-zinc-800 flex items-center justify-around py-2 z-50">
        <Link href={`/store/${slug}`} className="flex flex-col items-center gap-1 w-16" style={{ color: primaryColor }}>
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Home</span>
        </Link>
        <Link href={`/store/${slug}/categorias`} className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300 w-16">
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-medium">Categoria</span>
        </Link>
        <Link href={`/store/${slug}/carrinho`} className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300 w-16 relative">
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[10px] font-medium">Carrinho</span>
        </Link>
        <Link href={`/store/${slug}/meus-acessos`} className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300 w-16">
          <PlaySquare className="w-5 h-5" />
          <span className="text-[10px] font-medium">Meus Acessos</span>
        </Link>
        <Link href={`/store/${slug}/suporte`} className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300 w-16">
          <Headset className="w-5 h-5" />
          <span className="text-[10px] font-medium">Suporte</span>
        </Link>
      </nav>

      <div className="fixed bottom-16 w-full max-w-md text-center py-2 bg-transparent pointer-events-none">
        <span className="text-[11px] text-zinc-600">{botUsername}</span>
      </div>
    </div>
  )
}
