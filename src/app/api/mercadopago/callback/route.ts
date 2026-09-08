import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encryptSecret } from "@/lib/security/crypto";
import { verifyOAuthState } from "@/lib/security/oauth-state";

export async function GET(request: NextRequest) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const financeUrl = new URL("/finance", appUrl);

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    financeUrl.searchParams.set("mp_error", "missing_params");
    return NextResponse.redirect(financeUrl);
  }

  const tenantId = verifyOAuthState(state);
  if (!tenantId) {
    financeUrl.searchParams.set("mp_error", "invalid_state");
    return NextResponse.redirect(financeUrl);
  }

  const clientId = process.env.MERCADOPAGO_CLIENT_ID;
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;
  const redirectUri = process.env.MERCADOPAGO_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    financeUrl.searchParams.set("mp_error", "server_not_configured");
    return NextResponse.redirect(financeUrl);
  }

  try {
    const tokenResponse = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      financeUrl.searchParams.set("mp_error", "token_exchange_failed");
      return NextResponse.redirect(financeUrl);
    }

    const tokenData = await tokenResponse.json();
    const accessToken: string = tokenData.access_token;
    const refreshToken: string | undefined = tokenData.refresh_token;
    const publicKey: string | undefined = tokenData.public_key;
    const expiresIn: number | undefined = tokenData.expires_in;

    const existing = await db.orm.public.PaymentGatewayConnection.first({
      tenantId,
      gateway: "MERCADO_PAGO",
    });

    const data = {
      accessToken: encryptSecret(accessToken),
      refreshToken: refreshToken ? encryptSecret(refreshToken) : undefined,
      publicKey,
      isActive: true,
      expiresAt: expiresIn
        ? new Date(Date.now() + expiresIn * 1000)
        : undefined,
    };

    if (existing) {
      await db.orm.public.PaymentGatewayConnection.where({
        id: existing.id,
      }).update(data);
    } else {
      await db.orm.public.PaymentGatewayConnection.create({
        tenantId,
        gateway: "MERCADO_PAGO",
        ...data,
      });
    }

    financeUrl.searchParams.set("mp_connected", "1");
    return NextResponse.redirect(financeUrl);
  } catch (error) {
    console.error("[MercadoPago OAuth Callback]", error);
    financeUrl.searchParams.set("mp_error", "unexpected_error");
    return NextResponse.redirect(financeUrl);
  }
}
