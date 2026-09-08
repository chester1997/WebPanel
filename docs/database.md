# Banco de dados

PostgreSQL via Neon. O schema vive em `prisma/contract.prisma`.

## Por que "contrato" e não "schema.prisma" clássico

O pacote `prisma` instalado neste projeto é a linha "Prisma Next" (`8.0.0-rc.x`), que troca o
fluxo clássico (`schema.prisma` → `prisma generate` → `PrismaClient`) por um fluxo baseado em
contrato:

| Conceito clássico              | Equivalente aqui                                    |
| ------------------------------- | ----------------------------------------------------- |
| `prisma/schema.prisma`          | `prisma/contract.prisma`                              |
| `prisma generate`                | `npm run db:emit` (`prisma contract emit`)            |
| `prisma migrate dev` / `db push` | `npm run db:init` (aditivo) / `npm run db:update`      |
| `new PrismaClient()`              | `db` exportado de `prisma/db.ts` (`postgres({...})`)   |
| `prisma.model.findMany(...)`     | `db.orm.public.Model.where(...).all()`                |
| `prisma.model.findUnique(...)`   | `db.orm.public.Model.first({ ...campos únicos })`     |
| `prisma.model.create(...)`       | `db.orm.public.Model.create({...})`                    |
| `prisma.model.update(...)`       | `db.orm.public.Model.where({...}).update({...})`      |
| `prisma.model.delete(...)`       | `db.orm.public.Model.where({...}).delete()`           |
| `prisma.$transaction(...)`       | `db.transaction(async (tx) => { ... tx.orm ... })`     |

Diferenças de PSL notadas ao migrar o schema real deste projeto:

- IDs de texto usam `@default(uuid())` — `cuid()` não é suportado por este parser.
- Não existe mais `@db.Text`; use `String`/`String?` normalmente (mapeia para `text` no Postgres).
- `@updatedAt` não existe mais como atributo; o campo vira `updatedAt temporal.updatedAt()`
  (sem tipo explícito antes — o preset já define tipo + comportamento).

`db.orm.<namespace>.<Model>` — `<namespace>` é o schema do Postgres (`public` por padrão, já
que este projeto não usa `@@schema`).

**Atenção às operações singulares vs. em massa**: `.update(...)` e `.delete()` (sem sufixo)
afetam **apenas a primeira linha** que casar com o `.where(...)` anterior. Para atualizar ou
apagar todas as linhas que casam com o filtro, use `.updateAll(...)` / `.deleteAll()`
(retornam as linhas afetadas, streaming) ou `.updateAndCount(...)` / `.deleteAndCount()`
(retornam só a contagem).

## Fluxo de trabalho

```bash
# depois de editar prisma/contract.prisma
npm run db:emit     # recompila contract.json/contract.d.ts (offline, sem banco)
npm run db:update    # aplica o diff no banco configurado em DATABASE_URL
```

`prisma db init` (rodado uma vez para bootstrap) só faz operações aditivas; um conflito que
exigiria mudança destrutiva interrompe o comando em vez de aplicar silenciosamente.

## Multi-tenancy

Toda entidade comercial tem `tenantId`. Não há Row Level Security do Postgres configurada
neste momento — o isolamento é garantido na camada de aplicação (`src/lib/auth/session.ts` +
toda query de negócio filtrando por `tenantId` resolvido no servidor). Ver `docs/security.md`.

## Seed

`prisma/seed.ts` cria apenas dados estruturais: os planos da plataforma (`Plan`) e o usuário
Super Admin (`SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD` do `.env`). Nenhum tenant, produto ou
venda de exemplo é criado pelo seed — a primeira loja (inclusive a do Studio Shorts) é criada
pelo fluxo normal de onboarding, como qualquer outro vendedor.
