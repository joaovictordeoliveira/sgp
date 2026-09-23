import { createClient } from '@/lib/supabase/server'
import LogisticaTool from './logistica-tool'

export default async function LogisticaPage() {
  const supabase = createClient()
  const { data: materiais } = await supabase.from('materiais_logistica').select('*').order('nome')
  const { data: entregas } = await supabase.from('entregas_logistica').select('*').order('data', { ascending: false })

  return (
    <main className="p-8 max-w-6xl">
      <div className="mb-5">
        <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500 mb-1">Painel / Gabinete</div>
        <h1 className="text-2xl font-bold">Logística</h1>
        <p className="text-sm text-slate-500 mt-1">Controle de materiais políticos e entregas por região.</p>
      </div>
      <LogisticaTool materiaisIniciais={materiais ?? []} entregasIniciais={entregas ?? []} />
    </main>
  )
}
