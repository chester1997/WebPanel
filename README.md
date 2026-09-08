# Plataforma SaaS para lojas no Telegram

Plataforma multi-tenant que permite que qualquer vendedor crie sua própria loja dentro do
Telegram: bot conectado via BotFather, Mini App personalizável, catálogo de produtos e
conteúdo, cobrança via Mercado Pago (com outros gateways preparados) e entrega automática
de acesso após pagamento confirmado.

Studio Shorts é apenas o primeiro tenant da plataforma — nada no código é específico a ele;
qualquer vendedor cria sua loja pelo mesmo fluxo genérico.

## Stack

- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js Route Handlers, Server Actions, Zod
- **Banco**: PostgreSQL (Neon)
- **ORM**: Prisma (Prisma Next / contract-based — ver nota abaixo)
- **Auth**: NextAuth (Credentials + JWT), RBAC por tenant
- **Telegram**: Bot API + Webhooks + Mini Apps
- **Pagamentos**: Mercado Pago (OAuth + token manual), abstração para outros gateways

> **Nota sobre o Prisma instalado neste projeto**: a versão do Prisma usada aqui (`prisma@8.0.0-rc.x`,
> "Prisma Next") substitui o fluxo clássico `schema.prisma` + `PrismaClient` + `prisma generate` /
> `prisma migrate` por um fluxo baseado em **contrato**: `prisma/contract.prisma` é compilado com
> `prisma contract emit` em `prisma/contract.json` / `prisma/contract.d.ts`, e o cliente
> (`prisma/db.ts`, exportado como `db`) é consultado com uma API fluente
> (`db.orm.public.Model.where(...).first()/.all()/.create()/...`) em vez do `prisma.model.findMany(...)`
> tradicional. Isso não é um erro deste projeto — é a API real do pacote instalado.

## Como rodar localmente

### 1. Instalar dependências

```bash
npm install
```

> `npm install` pode demorar bastante na primeira vez: o CLI `prisma` deste projeto ("Prisma
> Next", `8.0.0-rc.x`) empacota uma plataforma de deploy multi-cloud inteira como parte da sua
> árvore de dependências (AWS, Cloudflare, Neon, PlanetScale, Fly.io, Hetzner...), mesmo que
> usemos apenas a parte de ORM/contrato. Não é um erro — apenas aguarde.

Depois de instalar, gere o contrato (não precisa de banco para isso):

```bash
npm run db:emit
```

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

- `DATABASE_URL`: string de conexão do seu banco Neon PostgreSQL.
- `AUTH_SECRET`: gere com `openssl rand -base64 32`.
- `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`: credenciais do super admin criado pelo seed.
- Demais variáveis (Telegram, Mercado Pago, storage) são necessárias apenas quando essas
  integrações forem usadas — veja `.env.example` para a lista completa e o que cada uma faz.

### 3. Preparar o banco (Neon)

```bash
npx prisma db init      # cria as tabelas a partir do contrato (idempotente, aditivo)
npm run db:seed         # cria os planos da plataforma e o super admin
```

Para aplicar mudanças de schema depois de editar `prisma/contract.prisma`:

```bash
npm run db:emit         # recompila contract.json/contract.d.ts
npm run db:update       # aplica o diff no banco (pede confirmação se for destrutivo)
```

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Fluxo funcional

1. Crie uma conta em `/register`.
2. Você será levado a `/onboarding` para criar sua loja (tenant) — isso cria o `Tenant` e uma
   `Membership` com papel `OWNER` para o seu usuário.
3. No painel (`/dashboard`), conecte um bot com o token do BotFather (Telegram → Bots).
4. Cadastre produtos, configure o Mini App e conecte o Mercado Pago (fases seguintes).

Nenhuma dessas etapas é hardcoded para um tenant específico — tudo passa pelas mesmas
tabelas e telas para qualquer vendedor.

## Arquitetura multi-tenant

Toda entidade comercial (`Product`, `Order`, `Customer`, `Bot`, ...) pertence a um `Tenant`.
O tenant ativo da sessão **nunca** é confiado a partir do client: ele é resolvido no servidor
a partir da sessão autenticada + um cookie httpOnly, validado contra as `Membership`s do
usuário no banco a cada request (`src/lib/auth/session.ts`). Toda query de dado comercial deve
ser filtrada por `tenantId` resolvido dessa forma.

`SUPER_ADMIN` é um atributo de plataforma (`User.isSuperAdmin`), não um papel de tenant —
controla toda a plataforma e não pertence a nenhuma loja específica. Papéis de tenant
(`OWNER`, `MANAGER`, `STAFF`) vivem em `Membership.role`.

## Segurança de tokens

Tokens de bot e credenciais de gateway de pagamento pertencem ao tenant no banco de dados,
nunca ao `.env` da plataforma — cada vendedor conecta as próprias credenciais. Eles devem ser
criptografados em repouso e nunca enviados a componentes client-side ou registrados em logs
(ver `docs/security.md`, fase de integração com Telegram/Mercado Pago).

## Documentação

- [docs/architecture.md](docs/architecture.md)
- [docs/database.md](docs/database.md)
- [docs/telegram.md](docs/telegram.md)
- [docs/mercadopago.md](docs/mercadopago.md)
- [docs/deployment.md](docs/deployment.md)
- [docs/security.md](docs/security.md)

## Deploy (Vercel)

O projeto é compatível com Vercel (Route Handlers para webhooks, sem filesystem persistente,
sem processos long-running). Configure as variáveis de ambiente de produção no painel da
Vercel e rode `npx prisma db update` contra o banco de produção como parte do processo de
deploy (ver `docs/deployment.md`).
