import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enviarWhatsApp } from '@/lib/integracoes/enviar'

// GET /api/cron/aniversarios
// Chamado automaticamente pela Vercel todo dia (ver vercel.json).
// Busca eleitores cujo dia/mês de nascimento é hoje e manda parabéns por WhatsApp.
//
// Protegido por CRON_SECRET: só a própria Vercel (ou quem tiver o segredo) pode chamar.

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const admin = createAdminClient()

  const hoje = new Date()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')

  // Busca todo mundo com data de nascimento preenchida e filtra o dia/mês em código
  // (evita depender de função de data específica do Postgres na query do client).
  const { data: eleitores, error } = await admin
    .from('eleitores')
    .select('id, nome, telefone, data_nascimento')
    .not('data_nascimento', 'is', null)
    .not('telefone', 'is', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const aniversariantes = (eleitores ?? []).filter((e) => {
    const [, m, d] = (e.data_nascimento as string).split('-')
    return m === mes && d === dia
  })

  let enviados = 0
  let falhas = 0

  for (const pessoa of aniversariantes) {
    const primeiroNome = pessoa.nome.split(' ')[0]
    const mensagem = `Parabéns, ${primeiroNome}! 🎉 Desejamos a você um feliz aniversário, com muita saúde e alegria. Um grande abraço do nosso gabinete!`
    const ok = await enviarWhatsApp(pessoa.telefone as string, mensagem)
    ok ? enviados++ : falhas++
  }

  return NextResponse.json({
    ok: true,
    data: `${dia}/${mes}`,
    totalAniversariantes: aniversariantes.length,
    enviados,
    falhas,
  })
}
