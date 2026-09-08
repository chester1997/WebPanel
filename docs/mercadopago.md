# Integração com Mercado Pago

> Ainda não implementado neste repositório (fase 4 do roadmap). Este documento descreve o
> design planejado.

## Duas formas de conectar (por tenant)

1. **OAuth** (`Dashboard → Financeiro → Conectar minha conta`): fluxo padrão do Mercado Pago
   (`MERCADOPAGO_CLIENT_ID`/`MERCADOPAGO_CLIENT_SECRET` são da aplicação da plataforma, não do
   vendedor). `state` assinado e de uso único evita CSRF; o `authorization code` retornado no
   callback é trocado por `access_token`/`refresh_token`, que são criptografados e salvos em
   `PaymentGatewayConnection` — nunca no client, nunca no `.env`.
2. **Token manual**: campo para o vendedor colar um Access Token diretamente, com botão
   "Testar conexão" antes de salvar.

## Abstração de gateway

`PaymentGateway` (interface) com `createPayment/getPayment/refundPayment/verifyPayment/
createWebhook/disconnect`, implementada por `MercadoPagoGateway` primeiro; `PushinPayGateway`,
`AsaasGateway` e `StripeGateway` seguem a mesma interface quando adicionados. Nenhuma rota ou
Server Action deve depender diretamente do SDK do Mercado Pago — sempre da interface.

## Webhook e idempotência

`POST /api/webhooks/mercadopago`: identifica tenant e payment, **revalida o pagamento
diretamente na API do Mercado Pago** (nunca confia só no payload do webhook), e só então
atualiza `Order`/`Payment`/`Subscription`/`CustomerAccess`. Cada evento processado é
registrado em `WebhookEvent` (`@@unique([provider, eventId])`) — um evento repetido não é
processado de novo.
