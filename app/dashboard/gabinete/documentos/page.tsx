import { createClient } from '@/lib/supabase/server'
import DocumentosTable from './documentos-table'

export default async function DocumentosPage() {
  const supabase = createClient()
  const { data } = await supabase.from('documentos').select('*').order('data', { ascending: false })

  return (
    <main className="p-8 max-w-6xl">
      <div className="mb-5">
        <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500 mb-1">Painel / Gabinete</div>
        <h1 className="text-2xl font-bold">Documentos &amp; Ofícios</h1>
      </div>
      <DocumentosTable dadosIniciais={data ?? []} />
    </main>
  )
}
