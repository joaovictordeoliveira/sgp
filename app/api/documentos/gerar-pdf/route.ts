import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { OficioPDF } from '@/lib/pdf/oficio-template'

// POST /api/documentos/gerar-pdf   body: { documentoId: string }
// Gera o PDF do ofício/requerimento, sobe pro Supabase Storage (bucket "documentos")
// e grava a URL pública na coluna documentos.arquivo_url
//
// Este arquivo é .ts (não .tsx) porque API Routes do Next.js precisam se chamar
// exatamente "route.ts". Por isso o componente com JSX fica em lib/pdf/oficio-template.tsx
// e aqui usamos React.createElement em vez de sintaxe JSX.

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { documentoId } = await req.json()
  if (!documentoId) return NextResponse.json({ error: 'documentoId é obrigatório.' }, { status: 400 })

  const admin = createAdminClient()
  const { data: doc, error: erroBusca } = await admin.from('documentos').select('*').eq('id', documentoId).single()
  if (erroBusca || !doc) return NextResponse.json({ error: 'Documento não encontrado.' }, { status: 404 })

  const dataFormatada = new Date(doc.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  const elemento = React.createElement(OficioPDF, {
    tipo: doc.tipo,
    numero: doc.numero,
    destinatario: doc.destinatario,
    assunto: doc.assunto,
    dataFormatada,
  })

  const buffer = await renderToBuffer(elemento as any)

  function sanitizarNomeArquivo(texto: string) {
    return texto
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // troca tudo que não é letra/número por hífen
      .replace(/^-+|-+$/g, '') // remove hífen do começo/fim
  }

  const nomeArquivo = `${sanitizarNomeArquivo(doc.tipo)}-${sanitizarNomeArquivo(doc.numero)}.pdf`

  const { error: erroUpload } = await admin.storage
    .from('documentos')
    .upload(nomeArquivo, buffer, { contentType: 'application/pdf', upsert: true })

  if (erroUpload) {
    return NextResponse.json({ error: 'Erro ao salvar o PDF: ' + erroUpload.message }, { status: 500 })
  }

  const { data: urlData } = admin.storage.from('documentos').getPublicUrl(nomeArquivo)

  await admin.from('documentos').update({ arquivo_url: urlData.publicUrl }).eq('id', documentoId)

  return NextResponse.json({ ok: true, url: urlData.publicUrl })
}
