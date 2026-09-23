'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Material = { id: string; nome: string; categoria: string | null; estoque_atual: number }
type Entrega = { id: string; material_id: string | null; material_nome: string; quantidade: number; bairro: string; responsavel: string | null; data: string; status: string; observacao: string | null }

const STATUS_CLASSES: Record<string, string> = {
  'Planejada': 'bg-[#EDF1F6] text-[#5B6B82]',
  'Em rota': 'bg-[#DEEAF6] text-[#1E4E85]',
  'Entregue': 'bg-[#E1EEE4] text-[#2C6B41]',
}

export default function LogisticaTool({ materiaisIniciais, entregasIniciais }: { materiaisIniciais: Material[]; entregasIniciais: Entrega[] }) {
  const supabase = createClient()
  const [materiais, setMateriais] = useState<Material[]>(materiaisIniciais)
  const [entregas, setEntregas] = useState<Entrega[]>(entregasIniciais)

  const [modalMaterialAberto, setModalMaterialAberto] = useState(false)
  const [formMaterial, setFormMaterial] = useState({ nome: '', categoria: '', estoque: '' })

  const [modalEntregaAberto, setModalEntregaAberto] = useState(false)
  const [formEntrega, setFormEntrega] = useState({ materialId: '', quantidade: '', bairro: '', responsavel: '', status: 'Planejada', observacao: '' })

  async function salvarMaterial() {
    if (!formMaterial.nome.trim()) return
    const payload = { nome: formMaterial.nome, categoria: formMaterial.categoria || null, estoque_atual: parseInt(formMaterial.estoque || '0', 10) }
    const { data, error } = await supabase.from('materiais_logistica').insert(payload).select().single()
    if (!error && data) {
      setMateriais((prev) => [...prev, data as Material].sort((a, b) => a.nome.localeCompare(b.nome)))
      setFormMaterial({ nome: '', categoria: '', estoque: '' })
      setModalMaterialAberto(false)
    }
  }

  async function excluirMaterial(id: string) {
    if (!confirm('Excluir este material?')) return
    const { error } = await supabase.from('materiais_logistica').delete().eq('id', id)
    if (!error) setMateriais((prev) => prev.filter((m) => m.id !== id))
  }

  async function salvarEntrega() {
    if (!formEntrega.materialId || !formEntrega.quantidade || !formEntrega.bairro.trim()) return
    const material = materiais.find((m) => m.id === formEntrega.materialId)
    if (!material) return

    const payload = {
      material_id: material.id,
      material_nome: material.nome,
      quantidade: parseInt(formEntrega.quantidade, 10),
      bairro: formEntrega.bairro,
      responsavel: formEntrega.responsavel || null,
      status: formEntrega.status,
      observacao: formEntrega.observacao || null,
    }
    const { data, error } = await supabase.from('entregas_logistica').insert(payload).select().single()
    if (!error && data) {
      setEntregas((prev) => [data as Entrega, ...prev])
      // desconta do estoque
      const novoEstoque = Math.max(0, material.estoque_atual - payload.quantidade)
      await supabase.from('materiais_logistica').update({ estoque_atual: novoEstoque }).eq('id', material.id)
      setMateriais((prev) => prev.map((m) => (m.id === material.id ? { ...m, estoque_atual: novoEstoque } : m)))
      setFormEntrega({ materialId: '', quantidade: '', bairro: '', responsavel: '', status: 'Planejada', observacao: '' })
      setModalEntregaAberto(false)
    }
  }

  async function atualizarStatusEntrega(id: string, status: string) {
    const { error } = await supabase.from('entregas_logistica').update({ status }).eq('id', id)
    if (!error) setEntregas((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)))
  }

  async function excluirEntrega(id: string) {
    if (!confirm('Excluir esta entrega?')) return
    const { error } = await supabase.from('entregas_logistica').delete().eq('id', id)
    if (!error) setEntregas((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-line">
        <div className="flex justify-between items-center p-4 border-b border-line">
          <h3 className="font-semibold text-sm">Materiais em estoque</h3>
          <button onClick={() => setModalMaterialAberto(true)} className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 border border-blue-400">
            + Novo material
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left font-mono text-[10px] uppercase tracking-wide text-slate-500 border-b border-line">
              <th className="p-3">Material</th><th className="p-3">Categoria</th><th className="p-3">Estoque atual</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {materiais.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-500">Nenhum material cadastrado ainda.</td></tr>}
            {materiais.map((m) => (
              <tr key={m.id} className="border-b border-paper-dim">
                <td className="p-3 font-semibold">{m.nome}</td>
                <td className="p-3">{m.categoria || '—'}</td>
                <td className="p-3">{m.estoque_atual}</td>
                <td className="p-3"><button onClick={() => excluirMaterial(m.id)} className="border border-line px-2.5 py-1 text-xs font-semibold text-red-700">Excluir</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-line">
        <div className="flex justify-between items-center p-4 border-b border-line">
          <h3 className="font-semibold text-sm">Entregas por região</h3>
          <button onClick={() => setModalEntregaAberto(true)} className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 border border-blue-400">
            + Nova entrega
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left font-mono text-[10px] uppercase tracking-wide text-slate-500 border-b border-line">
              <th className="p-3">Material</th><th className="p-3">Qtd.</th><th className="p-3">Bairro</th><th className="p-3">Responsável</th><th className="p-3">Status</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {entregas.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-slate-500">Nenhuma entrega cadastrada ainda.</td></tr>}
            {entregas.map((e) => (
              <tr key={e.id} className="border-b border-paper-dim">
                <td className="p-3 font-semibold">{e.material_nome}</td>
                <td className="p-3">{e.quantidade}</td>
                <td className="p-3">{e.bairro}</td>
                <td className="p-3">{e.responsavel || '—'}</td>
                <td className="p-3">
                  <select value={e.status} onChange={(ev) => atualizarStatusEntrega(e.id, ev.target.value)} className={`text-xs font-semibold border-none px-2 py-1 ${STATUS_CLASSES[e.status]}`}>
                    <option>Planejada</option><option>Em rota</option><option>Entregue</option>
                  </select>
                </td>
                <td className="p-3"><button onClick={() => excluirEntrega(e.id)} className="border border-line px-2.5 py-1 text-xs font-semibold text-red-700">Excluir</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalMaterialAberto && (
        <div className="fixed inset-0 bg-navy-950/55 flex items-center justify-center z-50 p-5">
          <div className="bg-white w-full max-w-md border border-line p-6">
            <h3 className="font-bold text-lg mb-4">Novo material</h3>
            <div className="space-y-3">
              <input placeholder="Nome do material *" value={formMaterial.nome} onChange={(e) => setFormMaterial({ ...formMaterial, nome: e.target.value })} className="w-full border border-line px-3 py-2 text-sm" />
              <input placeholder="Categoria (ex: Impresso, Brinde)" value={formMaterial.categoria} onChange={(e) => setFormMaterial({ ...formMaterial, categoria: e.target.value })} className="w-full border border-line px-3 py-2 text-sm" />
              <input placeholder="Estoque inicial" type="number" value={formMaterial.estoque} onChange={(e) => setFormMaterial({ ...formMaterial, estoque: e.target.value })} className="w-full border border-line px-3 py-2 text-sm" />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setModalMaterialAberto(false)} className="border border-line px-4 py-2 text-sm font-semibold text-slate-500">Cancelar</button>
              <button onClick={salvarMaterial} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 text-sm font-semibold border border-blue-400">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {modalEntregaAberto && (
        <div className="fixed inset-0 bg-navy-950/55 flex items-center justify-center z-50 p-5">
          <div className="bg-white w-full max-w-md border border-line p-6">
            <h3 className="font-bold text-lg mb-4">Nova entrega</h3>
            <div className="space-y-3">
              <select value={formEntrega.materialId} onChange={(e) => setFormEntrega({ ...formEntrega, materialId: e.target.value })} className="w-full border border-line px-3 py-2 text-sm">
                <option value="">Selecione o material *</option>
                {materiais.map((m) => <option key={m.id} value={m.id}>{m.nome} (estoque: {m.estoque_atual})</option>)}
              </select>
              <input placeholder="Quantidade *" type="number" value={formEntrega.quantidade} onChange={(e) => setFormEntrega({ ...formEntrega, quantidade: e.target.value })} className="w-full border border-line px-3 py-2 text-sm" />
              <input placeholder="Bairro / região *" value={formEntrega.bairro} onChange={(e) => setFormEntrega({ ...formEntrega, bairro: e.target.value })} className="w-full border border-line px-3 py-2 text-sm" />
              <input placeholder="Responsável pela entrega" value={formEntrega.responsavel} onChange={(e) => setFormEntrega({ ...formEntrega, responsavel: e.target.value })} className="w-full border border-line px-3 py-2 text-sm" />
              <textarea placeholder="Observações" value={formEntrega.observacao} onChange={(e) => setFormEntrega({ ...formEntrega, observacao: e.target.value })} rows={2} className="w-full border border-line px-3 py-2 text-sm" />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setModalEntregaAberto(false)} className="border border-line px-4 py-2 text-sm font-semibold text-slate-500">Cancelar</button>
              <button onClick={salvarEntrega} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 text-sm font-semibold border border-blue-400">Salvar entrega</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
