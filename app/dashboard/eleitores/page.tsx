import { createClient } from '@/lib/supabase/server'
import EleitoresTable from './eleitores-table'

export default async function EleitoresPage() {
  const supabase = createClient()
  const { data: eleitores } = await supabase
    .from('eleitores')
    .select('*')
    .order('criado_em', { ascending: false })

  return (
    <main className="p-8 max-w-6xl">
      <div className="mb-5">
        <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500 mb-1">
          Painel / Território
        </div>
        <h1 className="text-2xl font-bold">Base de Eleitores</h1>
        <p className="text-sm text-slate-500 mt-1">
          Dados reais, compartilhados por toda a equipe do gabinete.
        </p>
      </div>

      {/* Renderização inicial no servidor; interações (criar/editar/excluir)
          acontecem no client component abaixo, direto contra o Supabase. */}
      <EleitoresTable eleitoresIniciais={eleitores ?? []} />
    </main>
  )
}
