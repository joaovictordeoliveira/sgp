import { createClient } from '@/lib/supabase/server'
import AgendaList from './agenda-list'

export default async function AgendaPage() {
  const supabase = createClient()
  const { data } = await supabase.from('eventos_agenda').select('*').order('data').order('hora')

  return (
    <main className="p-8 max-w-4xl">
      <div className="mb-5">
        <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500 mb-1">Painel / Gestão</div>
        <h1 className="text-2xl font-bold">Agenda</h1>
      </div>
      <AgendaList dadosIniciais={data ?? []} />
    </main>
  )
}
