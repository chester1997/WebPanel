// SDK do Mercado Pago ou Fetch direto
// Usaremos Fetch para manter o controle total (Next.js server-side)

export async function createMPPreference(accessToken: string, orderData: { id: string, title: string, price: number, webhookUrl: string }) {
  try {
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        items: [
          {
            id: orderData.id,
            title: orderData.title,
            quantity: 1,
            unit_price: orderData.price
          }
        ],
        external_reference: orderData.id,
        notification_url: orderData.webhookUrl, // Importante para recebermos os status
        auto_return: "approved",
      })
    })

    const data = await response.json()
    return { success: true, init_point: data.init_point, id: data.id }
  } catch (err) {
    return { success: false, error: "Erro ao gerar preferência do Mercado Pago" }
  }
}
