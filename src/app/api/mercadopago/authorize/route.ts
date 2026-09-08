import { NextResponse } from "next/server";
import { requireUser, requireTenant, assertRole } from "@/lib/auth/session";
import { createOAuthState } from "@/lib/security/oauth-state";

export async function GET() {
  const user = await requireUser();
  const { tenant, role } = await requireTenant(user.id);
  assertRole(role, "MANAGER");

  const clientId = process.env.MERCADOPAGO_CLIENT_ID;
  const redirectUri = process.env.MERCADOPAGO_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        error:
          "MERCADOPAGO_CLIENT_ID / MERCADOPAGO_REDIRECT_URI não configurados no servidor.",
      },
      { status: 500 }
    );
  }

  const state = createOAuthState(tenant.id);

  const authorizeUrl = new URL("https://auth.mercadopago.com.br/authorization");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("platform_id", "mp");
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);

  return NextResponse.redirect(authorizeUrl);
}
