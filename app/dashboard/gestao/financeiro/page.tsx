import { createClient } from '@/lib/supabase/server'
import FinanceiroTable from './financeiro-table'

export default async function FinanceiroPage() {
  const supabase = createClient()
  const { data } = await supabase.from('lancamentos_financeiros').select('*').order('data', { ascending: false })

  return (
    <main className="p-8 max-w-5xl">
      <div className="mb-5">
        <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500 mb-1">Painel / Gestão</div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
      </div>
      <FinanceiroTable dadosIniciais={data ?? []} />
    </main>
  )
}
