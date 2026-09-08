import { ReactNode } from "react"
import { Sidebar } from "@/components/layout/sidebar"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-zinc-900">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar genérica */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6">
          <div className="flex items-center text-white">
            <span className="font-semibold text-zinc-300">Tenant Ativo: </span>
            <span className="ml-2 px-2 py-1 bg-zinc-800 rounded text-sm">Studio Shorts (Mock)</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm text-zinc-400 hover:text-white">
              Sair
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-950 p-6 text-white">
          {children}
        </main>
      </div>
    </div>
  )
}
