import { createClient } from '@/lib/supabase/server'
import AtendimentosTable from './atendimentos-table'

export default async function AtendimentosPage() {
  const supabase = createClient()
  const { data } = await supabase.from('atendimentos').select('*').order('data', { ascending: false })

  return (
    <main className="p-8 max-w-6xl">
      <div className="mb-5">
        <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500 mb-1">Painel / Gabinete</div>
        <h1 className="text-2xl font-bold">Atendimento ao Cidadão</h1>
      </div>
      <AtendimentosTable dadosIniciais={data ?? []} />
    </main>
  )
}
