'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Atendimento = {
  id: string
  cidadao: string
  assunto: string
  bairro: string
  municipio: string | null
  endereco: string | null
  telefone: string | null
  email: string | null
  canal: string
  status: string
  data: string
  data_nascimento: string | null
  cpf: string | null
}

const STATUS_CLASSES: Record<string, string> = {
  'Aberto': 'bg-[#FBEFDD] text-[#8A5D1B]',
  'Em andamento': 'bg-[#DEEAF6] text-[#1E4E85]',
  'Concluído': 'bg-[#E1EEE4] text-[#2C6B41]',
}

function calcularIdade(dataNascimento: string | null): number | null {
  if (!dataNascimento) return null
  const nasc = new Date(dataNascimento)
  const hoje = new Date()
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const aindaNaoFezAniversario = hoje.getMonth() < nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())
  if (aindaNaoFezAniversario) idade--
  return idade
}

const FORM_VAZIO = {
  cidadao: '', assunto: '', bairro: '', municipio: '', endereco: '', telefone: '', email: '',
  canal: 'WhatsApp', status: 'Aberto', dataNascimento: '', cpf: '',
}

export default function AtendimentosTable({ dadosIniciais }: { dadosIniciais: Atendimento[] }) {
  const supabase = createClient()
  const [itens, setItens] = useState<Atendimento[]>(dadosIniciais)
  const [modalAberto, setModalAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)

  function abrirNovo() {
    setEditandoId(null)
    setForm(FORM_VAZIO)
    setModalAberto(true)
  }

  function abrirEdicao(a: Atendimento) {
    setEditandoId(a.id)
    setForm({
      cidadao: a.cidadao, assunto: a.assunto, bairro: a.bairro, municipio: a.municipio ?? '',
      endereco: a.endereco ?? '', telefone: a.telefone ?? '', email: a.email ?? '',
      canal: a.canal, status: a.status, dataNascimento: a.data_nascimento ?? '', cpf: a.cpf ?? '',
    })
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setEditandoId(null)
    setForm(FORM_VAZIO)
  }

  async function salvar() {
    if (!form.cidadao.trim() || !form.assunto.trim() || !form.bairro.trim()) return
    setSalvando(true)
    const payload = {
      cidadao: form.cidadao, assunto: form.assunto, bairro: form.bairro, municipio: form.municipio || null,
      endereco: form.endereco || null, telefone: form.telefone || null, email: form.email || null,
      canal: form.canal, status: form.status,
      data_nascimento: form.dataNascimento || null, cpf: form.cpf || null,
    }
    if (editandoId) {
      const { data, error } = await supabase.from('atendimentos').update(payload).eq('id', editandoId).select().single()
      if (!error && data) {
        setItens((prev) => prev.map((i) => (i.id === editandoId ? (data as Atendimento) : i)))
        fecharModal()
      } else if (error) {
        alert('Erro ao salvar: ' + error.message)
      }
    } else {
      const { data, error } = await supabase.from('atendimentos').insert(payload).select().single()
      if (!error && data) {
        setItens((prev) => [data as Atendimento, ...prev])
        fecharModal()
      } else if (error) {
        alert('Erro ao salvar: ' + error.message)
      }
    }
    setSalvando(false)
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
    <div className="bg-white border border-line/60 rounded-xl shadow-card overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-line">
        <h3 className="font-semibold text-sm">Atendimentos</h3>
        <button onClick={abrirNovo} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm hover:shadow-card-hover transition-base text-sm font-semibold px-4 py-2">
          + Novo atendimento
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left font-mono text-[10px] uppercase tracking-wide text-slate-500 border-b border-line">
              <th className="p-3">Cidadão</th><th className="p-3">Assunto</th><th className="p-3">Bairro</th><th className="p-3">Município</th><th className="p-3">Idade</th><th className="p-3">Status</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {itens.map((i) => (
              <tr key={i.id} className="border-b border-paper-dim">
                <td className="p-3 font-semibold whitespace-nowrap">{i.cidadao}</td>
                <td className="p-3">{i.assunto}</td>
                <td className="p-3">{i.bairro}</td>
                <td className="p-3">{i.municipio || '—'}</td>
                <td className="p-3">{calcularIdade(i.data_nascimento) ?? '—'}</td>
                <td className="p-3">
                  <select value={i.status} onChange={(e) => atualizarStatus(i.id, e.target.value)} className={`text-xs font-semibold border-none px-2.5 py-1 rounded-md ${STATUS_CLASSES[i.status]}`}>
                    <option>Aberto</option><option>Em andamento</option><option>Concluído</option>
                  </select>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <button onClick={() => abrirEdicao(i)} className="border border-line/70 px-2.5 py-1 text-xs font-semibold text-blue-600 rounded-md hover:bg-blue-50 hover:border-blue-200 transition-base mr-1.5">Editar</button>
                  <button onClick={() => excluir(i.id)} className="border border-line/70 px-2.5 py-1 text-xs font-semibold text-red-700 rounded-md hover:bg-red-50 hover:border-red-200 transition-base">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-5">
          <div className="bg-white w-full max-w-md border border-line p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">{editandoId ? 'Editar atendimento' : 'Novo atendimento'}</h3>
            <div className="space-y-3">
              <input placeholder="Nome completo do cidadão *" value={form.cidadao} onChange={(e) => setForm({ ...form, cidadao: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
              <input placeholder="Assunto *" value={form.assunto} onChange={(e) => setForm({ ...form, assunto: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
              <input placeholder="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
              <input placeholder="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Bairro *" value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
                <input placeholder="Município" value={form.municipio} onChange={(e) => setForm({ ...form, municipio: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
              </div>
              <input placeholder="Endereço (rua, número)" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
              <select value={form.canal} onChange={(e) => setForm({ ...form, canal: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15">
                <option>WhatsApp</option><option>Telefone</option><option>E-mail</option><option>Presencial</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[9.5px] uppercase tracking-wide text-slate-500 mb-1">Data de nascimento</label>
                  <input type="date" value={form.dataNascimento} onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
                </div>
                <div>
                  <label className="block font-mono text-[9.5px] uppercase tracking-wide text-slate-500 mb-1">CPF</label>
                  <input placeholder="000.000.000-00" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} className="w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={fecharModal} className="border border-line/70 px-4 py-2 text-sm font-semibold text-slate-500 rounded-lg hover:bg-paper-dim transition-base">Cancelar</button>
              <button onClick={salvar} disabled={salvando} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm hover:shadow-card-hover transition-base px-5 py-2 text-sm font-semibold disabled:opacity-60">
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
