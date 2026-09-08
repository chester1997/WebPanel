# Arquitetura

## Visão geral

```
PLATAFORMA
    |
    +-- TENANT A (loja no Telegram)
    |     +-- usuários (Membership: OWNER/MANAGER/STAFF)
    |     +-- bot + Mini App
    |     +-- produtos, categorias, conteúdo
    |     +-- clientes, pedidos, pagamentos, assinaturas
    |
    +-- TENANT B
    +-- TENANT N
```

Um único deploy Next.js atende todos os tenants. Não existe projeto separado por vendedor —
o tenant é resolvido em runtime a partir da sessão autenticada (painel) ou do slug da loja
(Mini App pública, `/store/[slug]`).

## Camadas

- `src/app` — rotas (App Router): grupos `(auth)` (login/registro, sem sidebar) e
  `(dashboard)` (painel do vendedor, protegido por `src/proxy.ts`), além de `/onboarding`,
  `/admin` (Super Admin, fase futura) e `/store/[slug]` (Mini App, fase futura).
- `src/modules/*` — regras de negócio por domínio (auth, tenants, telegram, products, ...):
  validação (Zod) e Server Actions. Cada módulo não deve depender de detalhes de UI.
- `src/lib` — infraestrutura compartilhada: `db.ts` (cliente do banco), `auth.ts` (NextAuth),
  `auth/session.ts` (resolução de sessão/tenant/RBAC), `security/*` (hashing, e futuramente
  criptografia de segredos).
- `prisma/contract.prisma` — schema (contrato) do banco. Ver `docs/database.md`.

## Resolução de tenant (nunca confiar no client)

`src/lib/auth/session.ts` é o único lugar que decide qual tenant uma request do painel está
operando:

1. `requireUser()` — exige sessão válida (NextAuth) e recarrega o usuário do banco (para
   refletir suspensão/`isSuperAdmin` imediatamente, já que o JWT só guarda o `id`).
2. `getCurrentTenant(userId)` — lê um cookie httpOnly (`active_tenant_id`) e valida contra as
   `Membership`s reais do usuário no banco. Um cookie apontando para um tenant ao qual o
   usuário não pertence mais é ignorado; a primeira membership vira o fallback.

Toda query de dado comercial (`Product`, `Order`, `Customer`, ...) deve receber o `tenantId`
resolvido dessa forma — nunca um `tenantId` vindo de `searchParams`, body do request ou
formulário.

## Papéis

- `User.isSuperAdmin` (booleano) — atributo de plataforma, controla toda a plataforma
  (`/admin`, fase futura). Não é um papel de tenant.
- `Membership.role` (`OWNER` | `MANAGER` | `STAFF`) — papel dentro de um tenant específico.

## Próximas fases

Bots/Telegram, Mini App, produtos/conteúdo, checkout/pagamentos, Super Admin/billing e
marketing/analytics serão adicionados fase a fase sobre esta base — ver `AGENTS.md`/histórico
de implementação para o roadmap detalhado.
