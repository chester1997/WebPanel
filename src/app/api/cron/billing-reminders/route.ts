import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/security/crypto";
import { sendTelegramMessage } from "@/modules/telegram/telegram-service";
import { DEFAULT_BILLING_REMINDERS, renderTemplate } from "@/modules/billing/defaults";

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

/**
 * Vercel Cron automatically sends `Authorization: Bearer $CRON_SECRET` when
 * CRON_SECRET is set as an env var — see docs/deployment.md. Without a
 * configured secret we only allow this outside production (local dev).
 */
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

type BillingReminderValues = typeof DEFAULT_BILLING_REMINDERS;

/** Varre pagamentos PIX pendentes e acessos prestes a expirar, disparando a régua de cobrança configurada por tenant. */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  let pixRemindersSent = 0;
  let planRemindersSent = 0;

  const settingsCache = new Map<string, BillingReminderValues>();
  const botCache = new Map<string, { token: string } | null>();

  async function getSettings(tenantId: string): Promise<BillingReminderValues> {
    const cached = settingsCache.get(tenantId);
    if (cached) return cached;
    const row = await db.orm.public.BillingReminderSettings.first({ tenantId });
    const value: BillingReminderValues = row
      ? {
          pixReminderActive: row.pixReminderActive,
          pixMsg5: row.pixMsg5,
          pixMsg7: row.pixMsg7,
          pixMsg10: row.pixMsg10,
          planReminderActive: row.planReminderActive,
          planMsg3d: row.planMsg3d,
          planMsg1d: row.planMsg1d,
          planMsgExpired: row.planMsgExpired,
        }
      : DEFAULT_BILLING_REMINDERS;
    settingsCache.set(tenantId, value);
    return value;
  }

  async function getBotToken(tenantId: string) {
    if (botCache.has(tenantId)) return botCache.get(tenantId) ?? null;
    const bot = await db.orm.public.Bot.first({ tenantId, status: "ACTIVE" });
    const value = bot ? { token: decryptSecret(bot.botToken) } : null;
    botCache.set(tenantId, value);
    return value;
  }

  // ---------- 1) Lembrete de PIX não pago ----------
  const pendingPayments = await db.orm.public.Payment.where({ status: "PENDING" }).all();

  for (const payment of pendingPayments) {
    const minutesElapsed = (now - new Date(payment.createdAt).getTime()) / MINUTE;
    if (minutesElapsed < 5) continue;

    const settings = await getSettings(payment.tenantId);
    if (!settings.pixReminderActive) continue;

    const order = await db.orm.public.Order.first({ id: payment.orderId });
    if (!order || order.status !== "PENDING") continue;

    const customer = await db.orm.public.Customer.first({ id: order.customerId });
    if (!customer || customer.status === "BANNED" || !customer.telegramId) continue;

    const bot = await getBotToken(payment.tenantId);
    if (!bot) continue;

    const items = await db.orm.public.OrderItem.where({ orderId: order.id }).all();
    const productIds = items.map((i) => i.productId);
    const products = productIds.length
      ? await db.orm.public.Product.where((p) => p.id.in(productIds)).all()
      : [];
    const produtoNome = products.map((p) => p.title).join(", ") || "seu pedido";
    const vars = { nome: customer.name || "cliente", produto: produtoNome };

    if (minutesElapsed >= 10 && !payment.pixReminder10SentAt) {
      const sent = await sendTelegramMessage(bot.token, customer.telegramId, renderTemplate(settings.pixMsg10, vars));
      if (sent.success) {
        await db.orm.public.Payment.where({ id: payment.id }).update({ pixReminder10SentAt: new Date() });
        pixRemindersSent++;
      }
    } else if (minutesElapsed >= 7 && !payment.pixReminder7SentAt) {
      const sent = await sendTelegramMessage(bot.token, customer.telegramId, renderTemplate(settings.pixMsg7, vars));
      if (sent.success) {
        await db.orm.public.Payment.where({ id: payment.id }).update({ pixReminder7SentAt: new Date() });
        pixRemindersSent++;
      }
    } else if (minutesElapsed >= 5 && !payment.pixReminder5SentAt) {
      const sent = await sendTelegramMessage(bot.token, customer.telegramId, renderTemplate(settings.pixMsg5, vars));
      if (sent.success) {
        await db.orm.public.Payment.where({ id: payment.id }).update({ pixReminder5SentAt: new Date() });
        pixRemindersSent++;
      }
    }
  }

  // ---------- 2) Lembrete de vencimento de plano ----------
  const activeAccesses = await db.orm.public.CustomerAccess.where({ status: "ACTIVE" }).all();

  for (const access of activeAccesses) {
    if (!access.expiresAt) continue;
    const daysLeft = (new Date(access.expiresAt).getTime() - now) / DAY;

    const customer = await db.orm.public.Customer.first({ id: access.customerId });
    if (!customer || customer.status === "BANNED" || !customer.telegramId) continue;

    const settings = await getSettings(customer.tenantId);
    if (!settings.planReminderActive) continue;

    const bot = await getBotToken(customer.tenantId);
    if (!bot) continue;

    const product = await db.orm.public.Product.first({ id: access.productId });
    const vars = {
      nome: customer.name || "cliente",
      produto: product?.title || "seu plano",
      vencimento: new Date(access.expiresAt).toLocaleDateString("pt-BR"),
    };

    if (daysLeft <= 0 && !access.expiredReminderSentAt) {
      const sent = await sendTelegramMessage(bot.token, customer.telegramId, renderTemplate(settings.planMsgExpired, vars));
      if (sent.success) {
        await db.orm.public.CustomerAccess.where({ id: access.id }).update({
          expiredReminderSentAt: new Date(),
          status: "EXPIRED",
        });
        planRemindersSent++;
      }
    } else if (daysLeft <= 1 && !access.reminder1dSentAt) {
      const sent = await sendTelegramMessage(bot.token, customer.telegramId, renderTemplate(settings.planMsg1d, vars));
      if (sent.success) {
        await db.orm.public.CustomerAccess.where({ id: access.id }).update({ reminder1dSentAt: new Date() });
        planRemindersSent++;
      }
    } else if (daysLeft <= 3 && !access.reminder3dSentAt) {
      const sent = await sendTelegramMessage(bot.token, customer.telegramId, renderTemplate(settings.planMsg3d, vars));
      if (sent.success) {
        await db.orm.public.CustomerAccess.where({ id: access.id }).update({ reminder3dSentAt: new Date() });
        planRemindersSent++;
      }
    }
  }

  return NextResponse.json({ ok: true, pixRemindersSent, planRemindersSent });
}
