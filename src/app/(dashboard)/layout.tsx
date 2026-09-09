import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { requireUser, getCurrentTenant } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const ctx = await getCurrentTenant(user.id);

  if (!ctx) {
    redirect("/onboarding");
  }

  return (
    <div className="flex h-screen w-full bg-[#0b0f19]">
      <Sidebar userName={user.name ?? user.email ?? "Usuário"} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-[#1f2235] bg-[#0b0f19] px-8">
          <div className="flex items-center text-white">
            <span className="font-semibold text-zinc-300">Loja: </span>
            <span className="ml-2 px-3 py-1 bg-[#1f2235] rounded-md text-sm text-zinc-300">
              {ctx.tenant.name}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400 font-medium">
              {user.name ?? user.email}
            </span>
            <SignOutButton />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#0b0f19] p-8 text-white">
          {children}
        </main>
      </div>
    </div>
  );
}
