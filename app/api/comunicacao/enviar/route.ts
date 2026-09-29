import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enviarWhatsApp, enviarSMS, enviarEmail } from '@/lib/integracoes/enviar'

// POST /api/comunicacao/enviar
// body: { canais: ('whatsapp'|'sms'|'email')[], bairro?: string, mensagem: string, assunto?: string, campanhaNome: string }
// Roda no SERVIDOR — as chaves nunca chegam ao navegador.

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const body = await req.json()
  const { canais, bairro, mensagem, assunto, campanhaNome } = body as {
    canais: string[]; bairro?: string; mensagem: string; assunto?: string; campanhaNome: string
  }

  if (!canais?.length || !mensagem || !campanhaNome) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 })
  }

  const admin = createAdminClient()
  let query = admin.from('eleitores').select('nome, telefone, email')
  if (bairro) query = query.eq('bairro', bairro)
  const { data: destinatarios, error: erroConsulta } = await query
  if (erroConsulta) {
    return NextResponse.json({ error: 'Erro ao buscar destinatários.' }, { status: 500 })
  }

  const resultado = { whatsapp: { enviados: 0, falhas: 0 }, sms: { enviados: 0, falhas: 0 }, email: { enviados: 0, falhas: 0 } }

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

  await admin.from('campanhas_comunicacao').insert({
    nome: campanhaNome,
    canais,
    status: 'Enviado',
    metricas: resultado,
    criado_por: user.id,
  })

  return NextResponse.json({ ok: true, totalDestinatarios: destinatarios?.length ?? 0, resultado })
}
