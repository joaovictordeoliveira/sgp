import { createClient } from '@/lib/supabase/server'
import SegmentacaoTool from './segmentacao-tool'

export default async function ComunicacaoPage() {
  const supabase = createClient()
  const { data: eleitores } = await supabase.from('eleitores').select('bairro, interesse, tags')
  const { data: segmentos } = await supabase.from('segmentos').select('*').order('criado_em', { ascending: false })

  const bairros = [...new Set((eleitores ?? []).map((e) => e.bairro).filter(Boolean))]

  return (
    <main className="p-8 max-w-4xl">
      <div className="mb-5">
        <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500 mb-1">Painel / Comunicação</div>
        <h1 className="text-2xl font-bold">Segmentação de Base</h1>
        <p className="text-sm text-slate-500 mt-1">
          Filtre eleitores reais e salve como lista de transmissão. O envio de WhatsApp/SMS/E-mail é a próxima
          etapa — exige conta comercial aprovada (Meta) e backend próprio para guardar as chaves de API com segurança.
        </p>
      </div>
      <SegmentacaoTool bairros={bairros} totalEleitores={eleitores?.length ?? 0} segmentosIniciais={segmentos ?? []} />
    </main>
  )
}
