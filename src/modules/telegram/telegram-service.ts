import { env } from "process"

const TELEGRAM_API_URL = "https://api.telegram.org"

export async function validateBotToken(token: string) {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/bot${token}/getMe`)
    const data = await response.json()
    
    if (!data.ok) {
      return { success: false, error: data.description }
    }
    
    return {
      success: true,
      bot: {
        id: data.result.id,
        first_name: data.result.first_name,
        username: data.result.username,
      }
    }
  } catch (error) {
    return { success: false, error: "Falha na comunicação com o Telegram" }
  }
}

export async function setWebhook(token: string, botId: string) {
  // Em desenvolvimento, o APP_URL deve apontar para o ngrok/localtunnel
  const appUrl = env.APP_URL || "http://localhost:3000"
  const webhookUrl = `${appUrl}/api/webhooks/telegram/${botId}`
  
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/bot${token}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message", "callback_query", "pre_checkout_query", "successful_payment"]
      })
    })
    
    const data = await response.json()
    return { success: data.ok, description: data.description }
  } catch (error) {
    return { success: false, error: "Falha ao configurar webhook" }
  }
}
