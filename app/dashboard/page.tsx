import { createClient } from '@/lib/supabase/server'

export default async function DashboardHome() {
  const supabase = createClient()

  const [eleitores, atendimentosAbertos, documentosTramitacao, eventosHoje] = await Promise.all([
    supabase.from('eleitores').select('id', { count: 'exact', head: true }),
    supabase.from('atendimentos').select('id', { count: 'exact', head: true }).neq('status', 'Concluído'),
    supabase.from('documentos').select('id', { count: 'exact', head: true }).in('status', ['Protocolado', 'Em análise']),
    supabase.from('eventos_agenda').select('*').eq('data', new Date().toISOString().slice(0, 10)).order('hora'),
  ])

  return (
    <main className="p-8">
      <div className="mb-5">
        <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500 mb-1">Painel / Visão geral</div>
        <h1 className="text-2xl font-bold">Resumo do mandato</h1>
      </div>

      <div className="grid grid-cols-4 gap-px bg-line border border-line mb-6">
        <div className="bg-white p-5">
          <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500 mb-2">Eleitores mapeados</div>
          <div className="font-display text-2xl font-extrabold">{eleitores.count ?? 0}</div>
        </div>
        <div className="bg-white p-5">
          <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500 mb-2">Atendimentos abertos</div>
          <div className="font-display text-2xl font-extrabold">{atendimentosAbertos.count ?? 0}</div>
        </div>
        <div className="bg-white p-5">
          <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500 mb-2">Documentos em tramitação</div>
          <div className="font-display text-2xl font-extrabold">{documentosTramitacao.count ?? 0}</div>
        </div>
        <div className="bg-white p-5">
          <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500 mb-2">Eventos hoje</div>
          <div className="font-display text-2xl font-extrabold">{eventosHoje.data?.length ?? 0}</div>
        </div>
      </div>

      <div className="bg-white border border-line">
        <div className="p-4 border-b border-line font-semibold text-sm">Agenda de hoje</div>
        <div className="p-4">
          {eventosHoje.data && eventosHoje.data.length > 0 ? (
            eventosHoje.data.map((ev) => (
              <div key={ev.id} className="flex gap-3 py-2.5 border-b border-paper-dim last:border-0">
                <div className="font-mono text-xs text-blue-600 w-12 shrink-0">{ev.hora?.slice(0, 5)}</div>
                <div>
                  <div className="text-xs font-semibold">{ev.titulo}</div>
                  <div className="text-[11px] text-slate-500">{ev.local}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-500 py-4 text-center">Nenhum evento agendado para hoje.</div>
          )}
        </div>
      </div>
    </main>
  )
}
