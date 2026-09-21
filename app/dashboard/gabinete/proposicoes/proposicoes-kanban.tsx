'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Proposicao = { id: string; tipo: string; titulo: string; detalhe: string | null; status: string; data: string }

const COLUNAS = ['Protocolado', 'Em comissão', 'Em votação', 'Aprovado', 'Arquivado']

export default function ProposicoesKanban({ dadosIniciais }: { dadosIniciais: Proposicao[] }) {
  const supabase = createClient()
  const [itens, setItens] = useState<Proposicao[]>(dadosIniciais)
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState({ tipo: 'Projeto de lei', titulo: '', detalhe: '', status: 'Protocolado' })

  async function salvar() {
    if (!form.titulo.trim()) return
    const { data, error } = await supabase.from('proposicoes').insert(form).select().single()
    if (!error && data) {
      setItens((prev) => [data as Proposicao, ...prev])
      setForm({ tipo: 'Projeto de lei', titulo: '', detalhe: '', status: 'Protocolado' })
      setModalAberto(false)
    }
  }

  async function moverStatus(id: string, status: string) {
    const { error } = await supabase.from('proposicoes').update({ status }).eq('id', id)
    if (!error) setItens((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)))
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta proposição?')) return
    const { error } = await supabase.from('proposicoes').delete().eq('id', id)
    if (!error) setItens((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setModalAberto(true)} className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 border border-blue-400">
          + Nova proposição
        </button>
      </div>

      <div className="grid grid-cols-5 gap-3.5 max-[1080px]:grid-cols-2">
        {COLUNAS.map((col) => (
          <div key={col}>
            <div className="font-mono text-[10.5px] uppercase tracking-wide text-slate-500 pb-2.5 flex justify-between">
              {col} <span className="bg-paper-dim px-1.5 rounded-full font-bold">{itens.filter((i) => i.status === col).length}</span>
            </div>
            {itens.filter((i) => i.status === col).map((p) => (
              <div key={p.id} className="bg-white border border-line p-3 mb-2.5">
                <span className="font-mono text-[9.5px] text-blue-600 uppercase block mb-1.5">{p.tipo}</span>
                <b className="block text-[12.5px] leading-snug mb-1.5">{p.titulo}</b>
                <div className="flex gap-1.5 mt-2">
                  <select value={p.status} onChange={(e) => moverStatus(p.id, e.target.value)} className="text-[10.5px] border border-line px-1.5 py-1 flex-1">
                    {COLUNAS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <button onClick={() => excluir(p.id)} className="text-[10.5px] border border-line px-2 text-red-700">✕</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-navy-950/55 flex items-center justify-center z-50 p-5">
          <div className="bg-white w-full max-w-md border border-line p-6">
            <h3 className="font-bold text-lg mb-4">Nova proposição</h3>
            <div className="space-y-3">
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full border border-line px-3 py-2 text-sm">
                <option>Projeto de lei</option><option>Indicação</option><option>Requerimento</option><option>Moção</option>
              </select>
              <input placeholder="Título / ementa *" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="w-full border border-line px-3 py-2 text-sm" />
              <input placeholder="Detalhe (órgão / pauta)" value={form.detalhe} onChange={(e) => setForm({ ...form, detalhe: e.target.value })} className="w-full border border-line px-3 py-2 text-sm" />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setModalAberto(false)} className="border border-line px-4 py-2 text-sm font-semibold text-slate-500">Cancelar</button>
              <button onClick={salvar} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 text-sm font-semibold border border-blue-400">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
