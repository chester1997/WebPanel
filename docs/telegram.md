# Integração com Telegram

> Ainda não implementado neste repositório (fase 2 do roadmap). Este documento descreve o
> design planejado para que a implementação siga um contrato claro.

## Conexão de bot (painel do vendedor)

1. Vendedor cola o token do BotFather em `Dashboard → Telegram → Bots`.
2. Backend chama `getMe` na Telegram Bot API para validar o token e obter `username`/nome.
3. Token é criptografado (`encryptSecret`, `src/lib/security/crypto.ts` — a implementar) e
   salvo em `Bot.botToken`; **nunca** é enviado de volta a um componente client, nem logado.
4. Backend registra o webhook (`setWebhook`) apontando para uma URL pública que identifica o
   bot pelo `Bot.id` (não pelo token): `POST /api/webhooks/telegram/[botId]`.
5. `TelegramWebhook.secret` é usado para validar que o request realmente veio do Telegram
   (header `X-Telegram-Bot-Api-Secret-Token`).

Um esqueleto de validação de token já existe em
[`src/modules/telegram/telegram-service.ts`](../src/modules/telegram/telegram-service.ts)
(`validateBotToken`, `setWebhook`) e será conectado ao fluxo de conexão de bot do painel.

## Mini App

Um único código de Mini App atende todos os tenants — o tenant é resolvido pela rota
(`/store/[slug]`), não por build separado. `initData` enviado pelo Telegram é sempre validado
no servidor (assinatura HMAC com o bot token) antes de qualquer identificação de cliente —
nunca confiar no usuário enviado pelo client sem essa validação.
