const TELEGRAM_API_URL = "https://api.telegram.org"

export interface TelegramBotInfo {
  id: number
  first_name: string
  username: string
}

export type TelegramServiceResult<T = undefined> =
  | ({ success: true } & (T extends undefined ? object : T))
  | { success: false; error: string }

export async function validateBotToken(
  token: string
): Promise<TelegramServiceResult<{ bot: TelegramBotInfo }>> {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/bot${token}/getMe`)
    const data = await response.json()

    if (!data.ok) {
      return { success: false, error: data.description ?? "Token inválido" }
    }

    return {
      success: true,
      bot: {
        id: data.result.id,
        first_name: data.result.first_name,
        username: data.result.username,
      },
    }
  } catch {
    return { success: false, error: "Falha na comunicação com o Telegram" }
  }
}

export async function setWebhook(
  token: string,
  botId: string,
  secretToken: string
): Promise<TelegramServiceResult> {
  const appUrl = process.env.APP_URL || "http://localhost:3000"
  const webhookUrl = `${appUrl}/api/webhooks/telegram/${botId}`

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/bot${token}/setWebhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: secretToken,
        allowed_updates: ["message", "callback_query", "pre_checkout_query", "successful_payment"],
      }),
    })

    const data = await response.json()
    if (!data.ok) {
      return { success: false, error: data.description ?? "Falha ao configurar webhook" }
    }
    return { success: true }
  } catch {
    return { success: false, error: "Falha ao configurar webhook" }
  }
}

export async function sendTelegramMessage(
  token: string,
  chatId: string,
  text: string
): Promise<TelegramServiceResult> {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    })

    const data = await response.json()
    if (!data.ok) {
      return { success: false, error: data.description ?? "Falha ao enviar mensagem" }
    }
    return { success: true }
  } catch {
    return { success: false, error: "Falha na comunicação com o Telegram" }
  }
}

export async function setChatMenuButton(
  token: string,
  miniAppUrl: string,
  buttonText: string = "Abrir App"
): Promise<TelegramServiceResult> {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/bot${token}/setChatMenuButton`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        menu_button: {
          type: "web_app",
          text: buttonText,
          web_app: {
            url: miniAppUrl,
          },
        },
      }),
    })

    const data = await response.json()
    if (!data.ok) {
      return { success: false, error: data.description ?? "Falha ao configurar botão do Mini App" }
    }
    return { success: true }
  } catch {
    return { success: false, error: "Falha na comunicação com o Telegram" }
  }
}
