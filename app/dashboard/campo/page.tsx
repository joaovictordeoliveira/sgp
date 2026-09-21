import { createClient } from '@/lib/supabase/server'
import RotasTable from './rotas-table'

export default async function CampoPage() {
  const supabase = createClient()
  const { data: rotas } = await supabase.from('rotas').select('*, perfis(nome)').order('data', { ascending: false })
  const { data: assessores } = await supabase.from('perfis').select('id, nome').eq('papel', 'assessor')

  return (
    <main className="p-8 max-w-5xl">
      <div className="mb-5">
        <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500 mb-1">Painel / Campo</div>
        <h1 className="text-2xl font-bold">Equipe de Rua</h1>
        <p className="text-sm text-slate-500 mt-1">Rotas do dia por assessor. O check-in em campo acontece pelo app mobile (próxima etapa).</p>
      </div>
      <RotasTable dadosIniciais={rotas ?? []} assessores={assessores ?? []} />
    </main>
  )
}
