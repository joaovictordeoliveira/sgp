import { createClient } from '@/lib/supabase/server'
import { buscarAniversariantes } from '@/lib/aniversarios'
import CalendarioAniversarios from './calendario'

export default async function AniversariosPage() {
  const supabase = createClient()
  const pessoas = await buscarAniversariantes(supabase)

  return (
    <main className="p-8 max-w-6xl">
      <div className="mb-5">
        <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500 mb-1">Painel / Gabinete / Atendimento</div>
        <h1 className="text-2xl font-bold">Calendário de aniversários</h1>
        <p className="text-sm text-slate-500 mt-1">Baseado nas datas de nascimento cadastradas em Atendimentos e na Base de Eleitores.</p>
      </div>
      <CalendarioAniversarios pessoas={pessoas} />
    </main>
  )
}
