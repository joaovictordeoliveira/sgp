'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Lancamento = { id: string; descricao: string; categoria: string; tipo: 'receita' | 'despesa'; valor: number; status: string; data: string }

export default function FinanceiroTable({ dadosIniciais }: { dadosIniciais: Lancamento[] }) {
  const supabase = createClient()
  const [itens, setItens] = useState<Lancamento[]>(dadosIniciais)
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState({ descricao: '', categoria: 'Pessoal', tipo: 'despesa' as 'receita' | 'despesa', valor: '', status: 'Pendente' })

  const saldo = itens.reduce((acc, i) => acc + (i.tipo === 'receita' ? Number(i.valor) : -Number(i.valor)), 0)
  const receitas = itens.filter((i) => i.tipo === 'receita').reduce((a, i) => a + Number(i.valor), 0)
  const despesas = itens.filter((i) => i.tipo === 'despesa').reduce((a, i) => a + Number(i.valor), 0)

  async function salvar() {
    if (!form.descricao.trim() || !form.valor) return
    const novo = { ...form, valor: parseFloat(form.valor) }
    const { data, error } = await supabase.from('lancamentos_financeiros').insert(novo).select().single()
    if (!error && data) {
      setItens((prev) => [data as Lancamento, ...prev])
      setForm({ descricao: '', categoria: 'Pessoal', tipo: 'despesa', valor: '', status: 'Pendente' })
      setModalAberto(false)
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este lançamento?')) return
    const { error } = await supabase.from('lancamentos_financeiros').delete().eq('id', id)
    if (!error) setItens((prev) => prev.filter((i) => i.id !== id))
  }

  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-line/60 shadow-card"><div className="font-mono text-[10px] uppercase text-slate-500 mb-2">Saldo</div><div className="font-display text-xl font-extrabold">{fmt(saldo)}</div></div>
        <div className="bg-white p-5 rounded-xl border border-line/60 shadow-card"><div className="font-mono text-[10px] uppercase text-slate-500 mb-2">Receitas</div><div className="font-display text-xl font-extrabold text-green-700">{fmt(receitas)}</div></div>
        <div className="bg-white p-5 rounded-xl border border-line/60 shadow-card"><div className="font-mono text-[10px] uppercase text-slate-500 mb-2">Despesas</div><div className="font-display text-xl font-extrabold text-red-700">{fmt(despesas)}</div></div>
      </div>

      <div className="bg-white border border-line/60 rounded-xl shadow-card overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-line">
          <h3 className="font-semibold text-sm">Lançamentos</h3>
          <button onClick={() => setModalAberto(true)} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm hover:shadow-card-hover transition-base text-sm font-semibold px-4 py-2">+ Novo lançamento</button>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="text-left font-mono text-[10px] uppercase tracking-wide text-slate-500 border-b border-line"><th className="p-3">Descrição</th><th className="p-3">Categoria</th><th className="p-3">Valor</th><th className="p-3"></th></tr></thead>
          <tbody>
            {itens.map((i) => (
              <tr key={i.id} className="border-b border-paper-dim">
                <td className="p-3">{i.descricao}</td>
                <td className="p-3">{i.categoria}</td>
                <td className={`p-3 font-semibold ${i.tipo === 'receita' ? 'text-green-700' : 'text-red-700'}`}>{i.tipo === 'receita' ? '+' : '−'} {fmt(Number(i.valor))}</td>
                <td className="p-3"><button onClick={() => excluir(i.id)} className="border border-line/70 px-2.5 py-1 text-xs font-semibold text-red-700 rounded-md hover:bg-red-50 hover:border-red-200 transition-base">Excluir</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-5">
          <div className="bg-white w-full max-w-md border border-line p-6">
            <h3 className="font-bold text-lg mb-4">Novo lançamento</h3>
            <div className="space-y-3">
              <input placeholder="Descrição *" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as 'receita' | 'despesa' })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15">
                <option value="despesa">Despesa</option><option value="receita">Receita</option>
              </select>
              <input placeholder="Categoria" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
              <input placeholder="Valor (ex: 1200.50) *" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setModalAberto(false)} className="border border-line/70 px-4 py-2 text-sm font-semibold text-slate-500 rounded-lg hover:bg-paper-dim transition-base">Cancelar</button>
              <button onClick={salvar} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm hover:shadow-card-hover transition-base px-5 py-2 text-sm font-semibold">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
