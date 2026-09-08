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
  } catch {
    return { success: false, error: "Erro ao gerar preferência do Mercado Pago" }
  }
}

interface RefreshTokenResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
}

/** Exchanges a stored refresh token for a new access token. */
export async function refreshMercadoPagoToken(
  refreshToken: string
): Promise<RefreshTokenResult> {
  const clientId = process.env.MERCADOPAGO_CLIENT_ID;
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { success: false, error: "MERCADOPAGO_CLIENT_ID/SECRET não configurados" };
  }

  try {
    const response = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      return { success: false, error: "Falha ao renovar token do Mercado Pago" };
    }

    const data = await response.json()
    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  } catch {
    return { success: false, error: "Falha ao renovar token do Mercado Pago" };
  }
}
