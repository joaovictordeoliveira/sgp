import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// POST /api/documentos/gerar-pdf   body: { documentoId: string }
// Gera o PDF do ofício/requerimento, sobe pro Supabase Storage (bucket "documentos")
// e grava a URL pública na coluna documentos.arquivo_url

const styles = StyleSheet.create({
  page: { padding: 50, fontSize: 11, fontFamily: 'Helvetica' },
  header: { marginBottom: 30, textAlign: 'center' },
  titulo: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  numero: { fontSize: 10, color: '#5B6B82' },
  data: { marginBottom: 20, textAlign: 'right' },
  destinatario: { marginBottom: 20 },
  corpo: { lineHeight: 1.6, marginBottom: 40 },
  assinatura: { marginTop: 60, textAlign: 'center', borderTop: '1px solid #000', paddingTop: 6, width: 220, alignSelf: 'center' },
})

function OficioPDF({ tipo, numero, destinatario, assunto, dataFormatada }: any) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.titulo}>{tipo.toUpperCase()}</Text>
          <Text style={styles.numero}>nº {numero}</Text>
        </View>
        <Text style={styles.data}>{dataFormatada}</Text>
        <View style={styles.destinatario}>
          <Text>Ao(À) {destinatario}</Text>
        </View>
        <View style={styles.corpo}>
          <Text>Assunto: {assunto}</Text>
          <Text style={{ marginTop: 16 }}>
            Vimos, por meio deste {tipo.toLowerCase()}, tratar do assunto acima referido, solicitando a
            devida atenção e providências que se fizerem necessárias.
          </Text>
        </View>
        <View style={styles.assinatura}>
          <Text>Assinatura do Parlamentar</Text>
        </View>
      </Page>
    </Document>
  )
}

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

  const buffer = await renderToBuffer(
    OficioPDF({ tipo: doc.tipo, numero: doc.numero, destinatario: doc.destinatario, assunto: doc.assunto, dataFormatada }) as any
  )

  const nomeArquivo = `${doc.tipo.toLowerCase().replace(/\s+/g, '-')}-${doc.numero.replace('/', '-')}.pdf`

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
