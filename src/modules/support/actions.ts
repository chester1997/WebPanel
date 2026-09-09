"use server";

import { db } from "@/lib/db";
import { getStoreCustomer } from "@/lib/telegram/customer-session";

export async function createSupportTicket(slug: string, formData: FormData) {
  const subject = formData.get("subject")?.toString().trim();
  const message = formData.get("message")?.toString().trim();

  if (!subject || !message) {
    return { error: "Preencha o assunto e a mensagem." };
  }

  const tenant = await db.orm.public.Tenant.first({ slug, status: "ACTIVE" });
  if (!tenant) return { error: "Loja não encontrada." };

  const customer = await getStoreCustomer(slug, tenant.id);

  try {
    const ticket = await db.orm.public.SupportTicket.create({
      tenantId: tenant.id,
      customerId: customer?.id,
      subject,
      status: "OPEN",
    });

    await db.orm.public.SupportTicketReply.create({
      ticketId: ticket.id,
      message,
      isFromCustomer: true,
    });

    return { success: true };
  } catch {
    return { error: "Erro ao abrir o chamado. Tente novamente." };
  }
}
