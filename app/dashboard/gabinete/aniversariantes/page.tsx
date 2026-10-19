import { createClient } from '@/lib/supabase/server'
import { buscarAniversariantes } from '@/lib/aniversarios'
import ListaAniversariantes from './lista'

export default async function AniversariantesPage() {
  const supabase = createClient()
  const pessoas = await buscarAniversariantes(supabase)

  return (
    <main className="p-8 max-w-4xl">
      <div className="mb-5">
        <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500 mb-1">Painel / Gabinete / Atendimento</div>
        <h1 className="text-2xl font-bold">Aniversariantes do mês</h1>
        <p className="text-sm text-slate-500 mt-1">Quem faz aniversário no mês, em ordem de dia, com atalho para enviar parabéns pelo WhatsApp.</p>
      </div>
      <ListaAniversariantes pessoas={pessoas} />
    </main>
  )
}
