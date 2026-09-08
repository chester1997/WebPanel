import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/security/crypto";
import { validateTelegramInitData } from "@/lib/telegram/init-data";
import { storeCustomerCookieName } from "@/lib/telegram/customer-session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { initData } = await request.json();

  if (!initData) {
    return NextResponse.json({ error: "initData ausente" }, { status: 400 });
  }

  const tenant = await db.orm.public.Tenant.first({ slug, status: "ACTIVE" });
  if (!tenant) {
    return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
  }

  const bot = await db.orm.public.Bot.first({ tenantId: tenant.id });
  if (!bot) {
    return NextResponse.json(
      { error: "Esta loja ainda não conectou um bot do Telegram" },
      { status: 400 }
    );
  }

  const botToken = decryptSecret(bot.botToken);
  const validated = validateTelegramInitData(initData, botToken);
  if (!validated) {
    return NextResponse.json({ error: "initData inválido" }, { status: 401 });
  }

  const telegramId = String(validated.user.id);
  const existing = await db.orm.public.Customer.first({
    tenantId: tenant.id,
    telegramId,
  });

  const customer = existing
    ? await db.orm.public.Customer.where({ id: existing.id }).update({
        name: validated.user.first_name,
        telegramUsername: validated.user.username,
      })
    : await db.orm.public.Customer.create({
        tenantId: tenant.id,
        telegramId,
        name: validated.user.first_name,
        telegramUsername: validated.user.username,
        status: "ACTIVE",
      });

  const response = NextResponse.json({ success: true });
  response.cookies.set(storeCustomerCookieName(slug), customer!.id, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: `/store/${slug}`,
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
