import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

// Define quais rotas são protegidas e públicas
const protectedRoutes = ["/dashboard", "/bots", "/products", "/customers", "/finance", "/settings"]
const adminRoutes = ["/admin"]

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isProtectedRoute = protectedRoutes.some((route) => nextUrl.pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some((route) => nextUrl.pathname.startsWith(route))

  // 1. Redirecionar para login se não estiver autenticado e for rota protegida
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/api/auth/signin", nextUrl))
  }

  // 2. Lógica de RBAC (Role Based Access Control)
  // Como `req.auth` contem a session, podemos ter o role lá.
  // if (isAdminRoute && req.auth?.user?.role !== "SUPER_ADMIN") { ... }

  return NextResponse.next()
})

export const config = {
  // Ignorar rotas de api, _next/static, public files e webhooks
  matcher: ["/((?!api/webhooks|_next/static|_next/image|favicon.ico).*)"],
}
