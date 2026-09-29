'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Material = { id: string; nome: string; categoria: string | null; estoque_atual: number }
type Entrega = { id: string; material_id: string | null; material_nome: string; quantidade: number; bairro: string; responsavel: string | null; data: string; status: string; observacao: string | null }
type Contrato = { id: string; fornecedor: string; objeto: string; valor: number | null; data_inicio: string | null; data_fim: string | null; status: string; observacao: string | null }

const STATUS_ENTREGA_CLASSES: Record<string, string> = {
  'Planejada': 'bg-[#EDF1F6] text-[#5B6B82]',
  'Em rota': 'bg-[#DEEAF6] text-[#1E4E85]',
  'Entregue': 'bg-[#E1EEE4] text-[#2C6B41]',
}
const STATUS_CONTRATO_CLASSES: Record<string, string> = {
  'Ativo': 'bg-[#E1EEE4] text-[#2C6B41]',
  'Pendente': 'bg-[#FBEFDD] text-[#8A5D1B]',
  'Encerrado': 'bg-[#F4E1DE] text-[#963B2A]',
}

function fmtData(iso: string | null) {
  if (!iso) return '—'
  return iso.split('-').reverse().join('/')
}
function fmtValor(v: number | null) {
  if (v === null || v === undefined) return '—'
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function LogisticaTool({ materiaisIniciais, entregasIniciais, contratosIniciais }: { materiaisIniciais: Material[]; entregasIniciais: Entrega[]; contratosIniciais: Contrato[] }) {
  const supabase = createClient()
  const [aba, setAba] = useState<'materiais' | 'entregas' | 'contratos'>('entregas')

  const [materiais, setMateriais] = useState<Material[]>(materiaisIniciais)
  const [entregas, setEntregas] = useState<Entrega[]>(entregasIniciais)
  const [contratos, setContratos] = useState<Contrato[]>(contratosIniciais)

  const [modalMaterialAberto, setModalMaterialAberto] = useState(false)
  const [formMaterial, setFormMaterial] = useState({ nome: '', categoria: '', estoque: '' })

  const [modalEntregaAberto, setModalEntregaAberto] = useState(false)
  const [formEntrega, setFormEntrega] = useState({ materialId: '', quantidade: '', bairro: '', responsavel: '', status: 'Planejada', observacao: '' })

  const [modalContratoAberto, setModalContratoAberto] = useState(false)
  const [editandoContratoId, setEditandoContratoId] = useState<string | null>(null)
  const [formContrato, setFormContrato] = useState({ fornecedor: '', objeto: '', valor: '', dataInicio: '', dataFim: '', status: 'Ativo', observacao: '' })

  // ---------- MATERIAIS ----------
  async function salvarMaterial() {
    if (!formMaterial.nome.trim()) return
    const payload = { nome: formMaterial.nome, categoria: formMaterial.categoria || null, estoque_atual: parseInt(formMaterial.estoque || '0', 10) }
    const { data, error } = await supabase.from('materiais_logistica').insert(payload).select().single()
    if (!error && data) {
      setMateriais((prev) => [...prev, data as Material].sort((a, b) => a.nome.localeCompare(b.nome)))
      setFormMaterial({ nome: '', categoria: '', estoque: '' })
      setModalMaterialAberto(false)
    } else if (error) {
      alert('Erro ao salvar: ' + error.message)
    }
  }
  async function excluirMaterial(id: string) {
    if (!confirm('Excluir este material?')) return
    const { error } = await supabase.from('materiais_logistica').delete().eq('id', id)
    if (!error) setMateriais((prev) => prev.filter((m) => m.id !== id))
  }

  // ---------- ENTREGAS ----------
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
      const novoEstoque = Math.max(0, material.estoque_atual - payload.quantidade)
      await supabase.from('materiais_logistica').update({ estoque_atual: novoEstoque }).eq('id', material.id)
      setMateriais((prev) => prev.map((m) => (m.id === material.id ? { ...m, estoque_atual: novoEstoque } : m)))
      setFormEntrega({ materialId: '', quantidade: '', bairro: '', responsavel: '', status: 'Planejada', observacao: '' })
      setModalEntregaAberto(false)
    } else if (error) {
      alert('Erro ao salvar: ' + error.message)
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

  // ---------- CONTRATOS ----------
  function abrirNovoContrato() {
    setEditandoContratoId(null)
    setFormContrato({ fornecedor: '', objeto: '', valor: '', dataInicio: '', dataFim: '', status: 'Ativo', observacao: '' })
    setModalContratoAberto(true)
  }
  function abrirEdicaoContrato(c: Contrato) {
    setEditandoContratoId(c.id)
    setFormContrato({
      fornecedor: c.fornecedor, objeto: c.objeto, valor: c.valor?.toString() ?? '',
      dataInicio: c.data_inicio ?? '', dataFim: c.data_fim ?? '', status: c.status, observacao: c.observacao ?? '',
    })
    setModalContratoAberto(true)
  }
  async function salvarContrato() {
    if (!formContrato.fornecedor.trim() || !formContrato.objeto.trim()) return
    const payload = {
      fornecedor: formContrato.fornecedor,
      objeto: formContrato.objeto,
      valor: formContrato.valor ? parseFloat(formContrato.valor) : null,
      data_inicio: formContrato.dataInicio || null,
      data_fim: formContrato.dataFim || null,
      status: formContrato.status,
      observacao: formContrato.observacao || null,
    }
    if (editandoContratoId) {
      const { data, error } = await supabase.from('contratos_logistica').update(payload).eq('id', editandoContratoId).select().single()
      if (!error && data) {
        setContratos((prev) => prev.map((c) => (c.id === editandoContratoId ? (data as Contrato) : c)))
        setModalContratoAberto(false)
      } else if (error) {
        alert('Erro ao salvar: ' + error.message)
      }
    } else {
      const { data, error } = await supabase.from('contratos_logistica').insert(payload).select().single()
      if (!error && data) {
        setContratos((prev) => [data as Contrato, ...prev])
        setModalContratoAberto(false)
      } else if (error) {
        alert('Erro ao salvar: ' + error.message)
      }
    }
  }
  async function excluirContrato(id: string) {
    if (!confirm('Excluir este contrato?')) return
    const { error } = await supabase.from('contratos_logistica').delete().eq('id', id)
    if (!error) setContratos((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div>
      <div className="flex gap-0.5 bg-line border border-line mb-5 w-fit">
        {(['entregas', 'materiais', 'contratos'] as const).map((a) => (
          <button key={a} onClick={() => setAba(a)} className={`px-5 py-3 text-sm font-semibold ${aba === a ? 'bg-navy-950 text-white' : 'bg-white text-slate-500'}`}>
            {a === 'entregas' ? 'Entregas por região' : a === 'materiais' ? 'Materiais' : 'Contratos'}
          </button>
        ))}
      </div>

      {/* ---------- ENTREGAS ---------- */}
      {aba === 'entregas' && (
        <div className="bg-white border border-line/60 rounded-xl shadow-card overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-line">
            <h3 className="font-semibold text-sm">Entregas por região</h3>
            <button onClick={() => setModalEntregaAberto(true)} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm hover:shadow-card-hover transition-base text-sm font-semibold px-4 py-2">+ Nova entrega</button>
          </div>
          <div className="p-4 space-y-3">
            {entregas.length === 0 && <div className="text-sm text-slate-500 text-center py-6">Nenhuma entrega cadastrada ainda.</div>}
            {entregas.map((e) => (
              <div key={e.id} className="border border-line p-3.5">
                <div className="flex justify-between items-start gap-3 flex-wrap mb-2">
                  <div>
                    <div className="font-semibold text-sm">{e.material_nome} · {e.quantidade} un.</div>
                    <div className="text-xs text-slate-500">{e.bairro}{e.responsavel ? ` · Responsável: ${e.responsavel}` : ''} · {fmtData(e.data)}</div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <select value={e.status} onChange={(ev) => atualizarStatusEntrega(e.id, ev.target.value)} className={`text-xs font-semibold border-none px-2.5 py-1 rounded-md ${STATUS_ENTREGA_CLASSES[e.status]}`}>
                      <option>Planejada</option><option>Em rota</option><option>Entregue</option>
                    </select>
                    <button onClick={() => excluirEntrega(e.id)} className="border border-line/70 px-2.5 py-1 text-xs font-semibold text-red-700 rounded-md hover:bg-red-50 hover:border-red-200 transition-base">Excluir</button>
                  </div>
                </div>
                {e.observacao && (
                  <div className="bg-paper-dim text-xs text-ink-soft p-2.5 mt-2">
                    <span className="font-mono text-[9.5px] uppercase tracking-wide text-slate-500 block mb-1">Observação para quem for entregar</span>
                    {e.observacao}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- MATERIAIS ---------- */}
      {aba === 'materiais' && (
        <div className="bg-white border border-line/60 rounded-xl shadow-card overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-line">
            <h3 className="font-semibold text-sm">Materiais em estoque</h3>
            <button onClick={() => setModalMaterialAberto(true)} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm hover:shadow-card-hover transition-base text-sm font-semibold px-4 py-2">+ Novo material</button>
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
                  <td className="p-3"><button onClick={() => excluirMaterial(m.id)} className="border border-line/70 px-2.5 py-1 text-xs font-semibold text-red-700 rounded-md hover:bg-red-50 hover:border-red-200 transition-base">Excluir</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------- CONTRATOS ---------- */}
      {aba === 'contratos' && (
        <div className="bg-white border border-line/60 rounded-xl shadow-card overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-line">
            <h3 className="font-semibold text-sm">Contratos do gabinete</h3>
            <button onClick={abrirNovoContrato} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm hover:shadow-card-hover transition-base text-sm font-semibold px-4 py-2">+ Novo contrato</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left font-mono text-[10px] uppercase tracking-wide text-slate-500 border-b border-line">
                <th className="p-3">Fornecedor</th><th className="p-3">Objeto</th><th className="p-3">Valor</th><th className="p-3">Vigência</th><th className="p-3">Status</th><th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {contratos.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-slate-500">Nenhum contrato cadastrado ainda.</td></tr>}
              {contratos.map((c) => (
                <tr key={c.id} className="border-b border-paper-dim">
                  <td className="p-3 font-semibold">{c.fornecedor}</td>
                  <td className="p-3">{c.objeto}</td>
                  <td className="p-3">{fmtValor(c.valor)}</td>
                  <td className="p-3">{fmtData(c.data_inicio)} – {fmtData(c.data_fim)}</td>
                  <td className="p-3"><span className={`text-xs font-semibold px-2 py-1 ${STATUS_CONTRATO_CLASSES[c.status]}`}>{c.status}</span></td>
                  <td className="p-3 whitespace-nowrap">
                    <button onClick={() => abrirEdicaoContrato(c)} className="border border-line/70 px-2.5 py-1 text-xs font-semibold text-blue-600 rounded-md hover:bg-blue-50 hover:border-blue-200 transition-base mr-1.5">Editar</button>
                    <button onClick={() => excluirContrato(c.id)} className="border border-line/70 px-2.5 py-1 text-xs font-semibold text-red-700 rounded-md hover:bg-red-50 hover:border-red-200 transition-base">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------- MODAIS ---------- */}
      {modalMaterialAberto && (
        <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-5">
          <div className="bg-white w-full max-w-md border border-line p-6">
            <h3 className="font-bold text-lg mb-4">Novo material</h3>
            <div className="space-y-3">
              <input placeholder="Nome do material *" value={formMaterial.nome} onChange={(e) => setFormMaterial({ ...formMaterial, nome: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
              <input placeholder="Categoria (ex: Impresso, Brinde)" value={formMaterial.categoria} onChange={(e) => setFormMaterial({ ...formMaterial, categoria: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
              <input placeholder="Estoque inicial" type="number" value={formMaterial.estoque} onChange={(e) => setFormMaterial({ ...formMaterial, estoque: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setModalMaterialAberto(false)} className="border border-line/70 px-4 py-2 text-sm font-semibold text-slate-500 rounded-lg hover:bg-paper-dim transition-base">Cancelar</button>
              <button onClick={salvarMaterial} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm hover:shadow-card-hover transition-base px-5 py-2 text-sm font-semibold">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {modalEntregaAberto && (
        <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-5">
          <div className="bg-white w-full max-w-md border border-line p-6">
            <h3 className="font-bold text-lg mb-4">Nova entrega</h3>
            <div className="space-y-3">
              <select value={formEntrega.materialId} onChange={(e) => setFormEntrega({ ...formEntrega, materialId: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15">
                <option value="">Selecione o material *</option>
                {materiais.map((m) => <option key={m.id} value={m.id}>{m.nome} (estoque: {m.estoque_atual})</option>)}
              </select>
              <input placeholder="Quantidade *" type="number" value={formEntrega.quantidade} onChange={(e) => setFormEntrega({ ...formEntrega, quantidade: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
              <input placeholder="Bairro / região *" value={formEntrega.bairro} onChange={(e) => setFormEntrega({ ...formEntrega, bairro: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
              <input placeholder="Responsável pela entrega" value={formEntrega.responsavel} onChange={(e) => setFormEntrega({ ...formEntrega, responsavel: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
              <div>
                <label className="block font-mono text-[9.5px] uppercase tracking-wide text-slate-500 mb-1">Observação para quem for entregar</label>
                <textarea placeholder="ex: deixar na portaria, falar com o síndico, endereço de referência..." value={formEntrega.observacao} onChange={(e) => setFormEntrega({ ...formEntrega, observacao: e.target.value })} rows={3} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setModalEntregaAberto(false)} className="border border-line/70 px-4 py-2 text-sm font-semibold text-slate-500 rounded-lg hover:bg-paper-dim transition-base">Cancelar</button>
              <button onClick={salvarEntrega} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm hover:shadow-card-hover transition-base px-5 py-2 text-sm font-semibold">Salvar entrega</button>
            </div>
          </div>
        </div>
      )}

      {modalContratoAberto && (
        <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-5">
          <div className="bg-white w-full max-w-md border border-line p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">{editandoContratoId ? 'Editar contrato' : 'Novo contrato'}</h3>
            <div className="space-y-3">
              <input placeholder="Fornecedor *" value={formContrato.fornecedor} onChange={(e) => setFormContrato({ ...formContrato, fornecedor: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
              <input placeholder="Objeto do contrato *" value={formContrato.objeto} onChange={(e) => setFormContrato({ ...formContrato, objeto: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
              <input placeholder="Valor (ex: 5000.00)" value={formContrato.valor} onChange={(e) => setFormContrato({ ...formContrato, valor: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[9.5px] uppercase tracking-wide text-slate-500 mb-1">Início da vigência</label>
                  <input type="date" value={formContrato.dataInicio} onChange={(e) => setFormContrato({ ...formContrato, dataInicio: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
                </div>
                <div>
                  <label className="block font-mono text-[9.5px] uppercase tracking-wide text-slate-500 mb-1">Fim da vigência</label>
                  <input type="date" value={formContrato.dataFim} onChange={(e) => setFormContrato({ ...formContrato, dataFim: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
                </div>
              </div>
              <select value={formContrato.status} onChange={(e) => setFormContrato({ ...formContrato, status: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15">
                <option>Ativo</option><option>Pendente</option><option>Encerrado</option>
              </select>
              <textarea placeholder="Observações" value={formContrato.observacao} onChange={(e) => setFormContrato({ ...formContrato, observacao: e.target.value })} rows={2} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setModalContratoAberto(false)} className="border border-line/70 px-4 py-2 text-sm font-semibold text-slate-500 rounded-lg hover:bg-paper-dim transition-base">Cancelar</button>
              <button onClick={salvarContrato} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm hover:shadow-card-hover transition-base px-5 py-2 text-sm font-semibold">Salvar contrato</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
