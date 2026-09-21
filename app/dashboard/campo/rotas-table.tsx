'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Rota = { id: string; assessor_id: string | null; data: string; status: string; paradas: any[]; perfis?: { nome: string } }
type Assessor = { id: string; nome: string }

export default function RotasTable({ dadosIniciais, assessores }: { dadosIniciais: Rota[]; assessores: Assessor[] }) {
  const supabase = createClient()
  const [itens, setItens] = useState<Rota[]>(dadosIniciais)
  const [modalAberto, setModalAberto] = useState(false)
  const [assessorId, setAssessorId] = useState('')
  const [paradasTexto, setParadasTexto] = useState('')

  async function salvar() {
    if (!assessorId || !paradasTexto.trim()) return
    const paradas = paradasTexto.split('\n').filter(Boolean).map((endereco, i) => ({ ordem: i + 1, endereco, concluida: false }))
    const { data, error } = await supabase.from('rotas').insert({ assessor_id: assessorId, paradas, status: 'Planejada' }).select('*, perfis(nome)').single()
    if (!error && data) {
      setItens((prev) => [data as Rota, ...prev])
      setAssessorId('')
      setParadasTexto('')
      setModalAberto(false)
    }
  }

  async function atualizarStatus(id: string, status: string) {
    const { error } = await supabase.from('rotas').update({ status }).eq('id', id)
    if (!error) setItens((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)))
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta rota?')) return
    const { error } = await supabase.from('rotas').delete().eq('id', id)
    if (!error) setItens((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="bg-white border border-line">
      <div className="flex justify-between items-center p-4 border-b border-line">
        <h3 className="font-semibold text-sm">Rotas planejadas</h3>
        <button onClick={() => setModalAberto(true)} className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 border border-blue-400">+ Nova rota</button>
      </div>
      <div className="p-4 space-y-3">
        {itens.length === 0 && <div className="text-sm text-slate-500 text-center py-6">Nenhuma rota cadastrada ainda.</div>}
        {itens.map((r) => (
          <div key={r.id} className="border border-line p-3.5">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold text-sm">{r.perfis?.nome ?? 'Assessor'}</div>
                <div className="text-xs text-slate-500">{r.paradas?.length ?? 0} parada(s) · {new Date(r.data).toLocaleDateString('pt-BR')}</div>
              </div>
              <div className="flex gap-2">
                <select value={r.status} onChange={(e) => atualizarStatus(r.id, e.target.value)} className="text-xs border border-line px-2 py-1">
                  <option>Planejada</option><option>Em andamento</option><option>Concluída</option>
                </select>
                <button onClick={() => excluir(r.id)} className="border border-line px-2.5 py-1 text-xs font-semibold text-red-700">Excluir</button>
              </div>
            </div>
            <ol className="text-xs text-slate-500 list-decimal list-inside space-y-0.5">
              {r.paradas?.map((p: any, idx: number) => <li key={idx}>{p.endereco}</li>)}
            </ol>
          </div>
        ))}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-navy-950/55 flex items-center justify-center z-50 p-5">
          <div className="bg-white w-full max-w-md border border-line p-6">
            <h3 className="font-bold text-lg mb-4">Nova rota</h3>
            <div className="space-y-3">
              <select value={assessorId} onChange={(e) => setAssessorId(e.target.value)} className="w-full border border-line px-3 py-2 text-sm">
                <option value="">Selecione o assessor *</option>
                {assessores.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
              <textarea placeholder="Um endereço por linha" value={paradasTexto} onChange={(e) => setParadasTexto(e.target.value)} rows={5} className="w-full border border-line px-3 py-2 text-sm" />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setModalAberto(false)} className="border border-line px-4 py-2 text-sm font-semibold text-slate-500">Cancelar</button>
              <button onClick={salvar} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 text-sm font-semibold border border-blue-400">Salvar rota</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
