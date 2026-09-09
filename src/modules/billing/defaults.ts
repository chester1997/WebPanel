export interface BillingReminderValues {
  pixReminderActive: boolean;
  pixMsg5: string;
  pixMsg7: string;
  pixMsg10: string;
  planReminderActive: boolean;
  planMsg3d: string;
  planMsg1d: string;
  planMsgExpired: string;
}

// Espelha os defaults de BillingReminderSettings no schema — usado quando o
// tenant ainda não salvou a própria régua de cobrança (nenhuma linha na tabela).
export const DEFAULT_BILLING_REMINDERS: BillingReminderValues = {
  pixReminderActive: true,
  pixMsg5: "Oi {nome}! 👋 Seu PIX para {produto} ainda está aguardando. Copie o código e finalize agora para garantir seu acesso!",
  pixMsg7: "⏳ {nome}, o PIX para {produto} continua em aberto. Não perca sua vaga!",
  pixMsg10: "⚠️ Última chamada, {nome}! O PIX para {produto} expira em breve. Finalize agora ou gere um novo no app.",
  planReminderActive: true,
  planMsg3d: "Olá {nome}! Seu plano {produto} vence em 3 dias. Renove agora para não perder o acesso.",
  planMsg1d: "Atenção {nome}! Seu plano {produto} vence AMANHÃ. Renove agora!",
  planMsgExpired: "{nome}, seu plano {produto} expirou. Renove para continuar com acesso.",
};

export function renderTemplate(
  template: string,
  vars: { nome: string; produto: string; vencimento?: string }
): string {
  return template
    .replaceAll("{nome}", vars.nome)
    .replaceAll("{produto}", vars.produto)
    .replaceAll("{vencimento}", vars.vencimento ?? "");
}
