// Funções de envio real — usadas tanto pelo disparo manual de campanhas
// quanto pelo cron job de aniversário. Chaves só existem no servidor.

export async function enviarWhatsApp(telefone: string, mensagem: string): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneId) return false

  const numero = telefone.replace(/\D/g, '')
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: numero.startsWith('55') ? numero : `55${numero}`,
        type: 'text',
        text: { body: mensagem },
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function enviarSMS(telefone: string, mensagem: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER
  if (!sid || !authToken || !from) return false

  const numero = telefone.replace(/\D/g, '')
  const to = numero.startsWith('55') ? `+${numero}` : `+55${numero}`

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: from, To: to, Body: mensagem }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function enviarEmail(destinatario: string, assunto: string, mensagem: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) return false

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: destinatario, subject: assunto, text: mensagem }),
    })
    return res.ok
  } catch {
    return false
  }
}
