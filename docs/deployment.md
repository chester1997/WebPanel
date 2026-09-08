# Deploy (Vercel)

## Checklist

- `npm run build` precisa passar em ambiente limpo antes de qualquer deploy.
- Variáveis de ambiente de produção configuradas no painel da Vercel (ver `.env.example` para
  a lista completa e o propósito de cada uma). `DATABASE_URL` deve apontar para o branch/banco
  Neon de produção.
- `npx prisma db update --no-interactive --confirm <nome-do-banco>` (ou `db init` na primeira
  vez) rodado contra o banco de produção como parte do pipeline de deploy — o build da Vercel
  em si não toca o banco automaticamente.
- Webhooks (Telegram, Mercado Pago) são Route Handlers (`src/app/api/webhooks/**`) — compatíveis
  com o modelo serverless da Vercel, sem processos long-running e sem depender de filesystem
  persistente.
- Nenhum segredo de vendedor (token de bot, access token de gateway) vive em variável de
  ambiente — todos ficam no banco, por tenant, criptografados.

## Banco (Neon)

Não é necessário banco local para produção. Migrations/atualizações de schema usam o fluxo de
contrato do Prisma Next — ver `docs/database.md`.
