# Segurança

## Implementado

- **Senhas**: hash com bcrypt (`src/lib/security/password.ts`, 12 rounds via `bcryptjs`).
  Nunca armazenadas em texto puro.
- **Sessão**: NextAuth com estratégia JWT (`AUTH_SECRET`). Sem adapter de banco — o JWT só
  carrega o `id` do usuário; status (`ACTIVE`/`SUSPENDED`) e `isSuperAdmin` são sempre
  reconferidos no banco a cada request via `requireUser()`, então uma suspensão feita pelo
  Super Admin tem efeito imediato mesmo com o JWT ainda válido.
- **Tenant isolation**: o tenant ativo nunca é confiado a partir do client — ver
  `docs/architecture.md#resolução-de-tenant-nunca-confiar-no-client`.
- **Rotas do painel protegidas**: `src/proxy.ts` redireciona para `/login` qualquer request a
  `/dashboard`, `/onboarding` ou `/admin` sem sessão válida. Como o Proxy roda antes do
  render mas não é a única barreira, cada Server Action/Route Handler que lê ou escreve dado
  de tenant também chama `requireUser()`/`requireTenant()` — nunca dependemos só do Proxy.

## Planejado (fases seguintes)

- `encryptSecret`/`decryptSecret` (`src/lib/security/crypto.ts`) para tokens de bot e
  credenciais de gateway de pagamento armazenados no banco.
- Validação de `initData` do Telegram Mini App (assinatura HMAC) no servidor.
- Validação de assinatura/secret dos webhooks (Telegram `X-Telegram-Bot-Api-Secret-Token`,
  Mercado Pago) e idempotência via `WebhookEvent`.
- `state` assinado de uso único no OAuth do Mercado Pago (CSRF).
- Rate limiting nas rotas públicas (auth, webhooks, checkout).
- `AuditLog`: nunca registra token de bot, access/refresh token de gateway ou senha — apenas
  ação, recurso e metadados.

## O que nunca fazer neste projeto

- Colocar token de bot ou credencial de gateway de um vendedor em variável de ambiente da
  plataforma — pertencem ao banco, por tenant.
- Confiar em `tenantId` enviado pelo client (query string, body, formulário) sem validar
  contra a `Membership` do usuário autenticado no banco.
- Considerar um pagamento aprovado só porque o frontend retornou sucesso — a confirmação real
  vem do webhook do gateway, revalidada diretamente na API do gateway.
