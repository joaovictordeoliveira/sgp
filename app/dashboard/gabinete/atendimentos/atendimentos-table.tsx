'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Atendimento = {
  id: string
  cidadao: string
  assunto: string
  bairro: string
  canal: string
  status: string
  data: string
}

const STATUS_CLASSES: Record<string, string> = {
  'Aberto': 'bg-[#FBEFDD] text-[#8A5D1B]',
  'Em andamento': 'bg-[#DEEAF6] text-[#1E4E85]',
  'Concluído': 'bg-[#E1EEE4] text-[#2C6B41]',
}

export default function AtendimentosTable({ dadosIniciais }: { dadosIniciais: Atendimento[] }) {
  const supabase = createClient()
  const [itens, setItens] = useState<Atendimento[]>(dadosIniciais)
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState({ cidadao: '', assunto: '', bairro: '', canal: 'WhatsApp', status: 'Aberto' })
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    if (!form.cidadao.trim() || !form.assunto.trim() || !form.bairro.trim()) return
    setSalvando(true)
    const { data, error } = await supabase.from('atendimentos').insert(form).select().single()
    setSalvando(false)
    if (!error && data) {
      setItens((prev) => [data as Atendimento, ...prev])
      setForm({ cidadao: '', assunto: '', bairro: '', canal: 'WhatsApp', status: 'Aberto' })
      setModalAberto(false)
    }
  }

  async function atualizarStatus(id: string, status: string) {
    const { error } = await supabase.from('atendimentos').update({ status }).eq('id', id)
    if (!error) setItens((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)))
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este atendimento?')) return
    const { error } = await supabase.from('atendimentos').delete().eq('id', id)
    if (!error) setItens((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="bg-white border border-line">
      <div className="flex justify-between items-center p-4 border-b border-line">
        <h3 className="font-semibold text-sm">Atendimentos</h3>
        <button onClick={() => setModalAberto(true)} className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 border border-blue-400">
          + Novo atendimento
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left font-mono text-[10px] uppercase tracking-wide text-slate-500 border-b border-line">
            <th className="p-3">Cidadão</th><th className="p-3">Assunto</th><th className="p-3">Bairro</th><th className="p-3">Status</th><th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {itens.map((i) => (
            <tr key={i.id} className="border-b border-paper-dim">
              <td className="p-3 font-semibold">{i.cidadao}</td>
              <td className="p-3">{i.assunto}</td>
              <td className="p-3">{i.bairro}</td>
              <td className="p-3">
                <select
                  value={i.status}
                  onChange={(e) => atualizarStatus(i.id, e.target.value)}
                  className={`text-xs font-semibold border-none px-2 py-1 ${STATUS_CLASSES[i.status]}`}
                >
                  <option>Aberto</option><option>Em andamento</option><option>Concluído</option>
                </select>
              </td>
              <td className="p-3">
                <button onClick={() => excluir(i.id)} className="border border-line px-2.5 py-1 text-xs font-semibold text-red-700">Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalAberto && (
        <div className="fixed inset-0 bg-navy-950/55 flex items-center justify-center z-50 p-5">
          <div className="bg-white w-full max-w-md border border-line p-6">
            <h3 className="font-bold text-lg mb-4">Novo atendimento</h3>
            <div className="space-y-3">
              <input placeholder="Cidadão *" value={form.cidadao} onChange={(e) => setForm({ ...form, cidadao: e.target.value })} className="w-full border border-line px-3 py-2 text-sm" />
              <input placeholder="Assunto *" value={form.assunto} onChange={(e) => setForm({ ...form, assunto: e.target.value })} className="w-full border border-line px-3 py-2 text-sm" />
              <input placeholder="Bairro *" value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} className="w-full border border-line px-3 py-2 text-sm" />
              <select value={form.canal} onChange={(e) => setForm({ ...form, canal: e.target.value })} className="w-full border border-line px-3 py-2 text-sm">
                <option>WhatsApp</option><option>Telefone</option><option>E-mail</option><option>Presencial</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setModalAberto(false)} className="border border-line px-4 py-2 text-sm font-semibold text-slate-500">Cancelar</button>
              <button onClick={salvar} disabled={salvando} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 text-sm font-semibold border border-blue-400 disabled:opacity-60">
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
