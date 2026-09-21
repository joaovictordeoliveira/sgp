import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/comunicacao/enviar
// body: { canais: ('whatsapp'|'sms'|'email')[], segmentoId?: string, bairro?: string, mensagem: string, assunto?: string, campanhaNome: string }
//
// Este endpoint roda no SERVIDOR — as chaves (WHATSAPP_TOKEN, TWILIO_*, RESEND_API_KEY)
// nunca chegam ao navegador. É por isso que isso não pode ser feito direto do client component.

export async function POST(req: NextRequest) {
  // 1. Confirma que quem está chamando está logado no sistema
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const body = await req.json()
  const { canais, bairro, mensagem, assunto, campanhaNome } = body as {
    canais: string[]
    bairro?: string
    mensagem: string
    assunto?: string
    campanhaNome: string
  }

  if (!canais?.length || !mensagem || !campanhaNome) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 2. Busca os destinatários reais (aplica o mesmo filtro do módulo de Segmentação)
  let query = admin.from('eleitores').select('nome, telefone, email')
  if (bairro) query = query.eq('bairro', bairro)
  const { data: destinatarios, error: erroConsulta } = await query
  if (erroConsulta) {
    return NextResponse.json({ error: 'Erro ao buscar destinatários.' }, { status: 500 })
  }

  const resultado = { whatsapp: { enviados: 0, falhas: 0 }, sms: { enviados: 0, falhas: 0 }, email: { enviados: 0, falhas: 0 } }

  // 3. Dispara por canal
  for (const pessoa of destinatarios ?? []) {
    if (canais.includes('whatsapp') && pessoa.telefone) {
      const ok = await enviarWhatsApp(pessoa.telefone, mensagem)
      ok ? resultado.whatsapp.enviados++ : resultado.whatsapp.falhas++
    }
    if (canais.includes('sms') && pessoa.telefone) {
      const ok = await enviarSMS(pessoa.telefone, mensagem)
      ok ? resultado.sms.enviados++ : resultado.sms.falhas++
    }
    if (canais.includes('email') && pessoa.email) {
      const ok = await enviarEmail(pessoa.email, assunto ?? campanhaNome, mensagem)
      ok ? resultado.email.enviados++ : resultado.email.falhas++
    }
  }

  // 4. Registra a campanha com as métricas reais
  await admin.from('campanhas_comunicacao').insert({
    nome: campanhaNome,
    canais,
    status: 'Enviado',
    metricas: resultado,
    criado_por: user.id,
  })

  return NextResponse.json({ ok: true, totalDestinatarios: destinatarios?.length ?? 0, resultado })
}

// ---------- WhatsApp (Meta Cloud API) ----------
async function enviarWhatsApp(telefone: string, mensagem: string): Promise<boolean> {
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

// ---------- SMS (Twilio) ----------
async function enviarSMS(telefone: string, mensagem: string): Promise<boolean> {
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

// ---------- E-mail (Resend) ----------
async function enviarEmail(destinatario: string, assunto: string, mensagem: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) return false

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: destinatario,
        subject: assunto,
        text: mensagem,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}
