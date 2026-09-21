import { createClient } from '@/lib/supabase/server'
import ProposicoesKanban from './proposicoes-kanban'

export default async function ProposicoesPage() {
  const supabase = createClient()
  const { data } = await supabase.from('proposicoes').select('*').order('data', { ascending: false })

  return (
    <main className="p-8">
      <div className="mb-5">
        <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500 mb-1">Painel / Gabinete</div>
        <h1 className="text-2xl font-bold">Proposições Legislativas</h1>
      </div>
      <ProposicoesKanban dadosIniciais={data ?? []} />
    </main>
  )
}
