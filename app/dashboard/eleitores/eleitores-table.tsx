'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Eleitor = {
  id: string
  nome: string
  telefone: string | null
  bairro: string
  endereco: string | null
  lat: number | null
  lng: number | null
  interesse: string | null
  tags: string[] | null
  data_nascimento: string | null
  cpf: string | null
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

function formatarAniversario(dataNascimento: string | null): string {
  if (!dataNascimento) return '—'
  const [, m, d] = dataNascimento.split('-')
  return `${d}/${m}`
}

const FORM_VAZIO = { nome: '', telefone: '', bairro: '', endereco: '', interesse: '', tags: '', dataNascimento: '', cpf: '' }

export default function EleitoresTable({ eleitoresIniciais }: { eleitoresIniciais: Eleitor[] }) {
  const supabase = createClient()
  const [eleitores, setEleitores] = useState<Eleitor[]>(eleitoresIniciais)
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState(FORM_VAZIO)

  async function geocodificar(endereco: string, bairro: string) {
    const query = encodeURIComponent(`${endereco}, ${bairro}, São Paulo, SP, Brasil`)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`
    try {
      const res = await fetch(url)
      const json = await res.json()
      if (json.status === 'OK' && json.results?.[0]) {
        const loc = json.results[0].geometry.location
        return { lat: loc.lat, lng: loc.lng }
      }
    } catch (e) {
      console.error('Erro de geocodificação', e)
    }
    return { lat: null, lng: null }
  }

  function abrirNovo() {
    setEditandoId(null)
    setForm(FORM_VAZIO)
    setModalAberto(true)
  }

  function abrirEdicao(e: Eleitor) {
    setEditandoId(e.id)
    setForm({
      nome: e.nome,
      telefone: e.telefone ?? '',
      bairro: e.bairro,
      endereco: e.endereco ?? '',
      interesse: e.interesse ?? '',
      tags: (e.tags ?? []).join(', '),
      dataNascimento: e.data_nascimento ?? '',
      cpf: e.cpf ?? '',
    })
    setModalAberto(true)
  }

  async function salvarEleitor() {
    if (!form.nome.trim() || !form.bairro.trim()) return
    setSalvando(true)

    let lat: number | null = null
    let lng: number | null = null

    const registroAtual = editandoId ? eleitores.find((e) => e.id === editandoId) : null
    const enderecoMudou = !registroAtual || registroAtual.endereco !== form.endereco || registroAtual.bairro !== form.bairro

    if (registroAtual && !enderecoMudou) {
      lat = registroAtual.lat
      lng = registroAtual.lng
    } else if (form.endereco) {
      const geo = await geocodificar(form.endereco, form.bairro)
      lat = geo.lat
      lng = geo.lng
    }

    const payload = {
      nome: form.nome,
      telefone: form.telefone || null,
      bairro: form.bairro,
      endereco: form.endereco || null,
      lat, lng,
      interesse: form.interesse || null,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      data_nascimento: form.dataNascimento || null,
      cpf: form.cpf || null,
    }

    if (editandoId) {
      const { data, error } = await supabase.from('eleitores').update(payload).eq('id', editandoId).select().single()
      if (!error && data) {
        setEleitores((prev) => prev.map((e) => (e.id === editandoId ? (data as Eleitor) : e)))
        fecharModal()
      }
    } else {
      const { data, error } = await supabase.from('eleitores').insert(payload).select().single()
      if (!error && data) {
        setEleitores((prev) => [data as Eleitor, ...prev])
        fecharModal()
      }
    }
    setSalvando(false)
  }

  function fecharModal() {
    setModalAberto(false)
    setEditandoId(null)
    setForm(FORM_VAZIO)
  }

  async function excluirEleitor(id: string) {
    if (!confirm('Excluir este eleitor?')) return
    const { error } = await supabase.from('eleitores').delete().eq('id', id)
    if (!error) setEleitores((prev) => prev.filter((e) => e.id !== id))
  }

  const filtrados = eleitores.filter((e) => e.nome.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div className="bg-white border border-line">
      <div className="flex justify-between items-center p-4 border-b border-line flex-wrap gap-3">
        <input
          placeholder="Buscar por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="border border-line px-3 py-2 text-sm bg-paper min-w-[220px]"
        />
        <button onClick={abrirNovo} className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 border border-blue-400">
          + Novo eleitor
        </button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left font-mono text-[10px] uppercase tracking-wide text-slate-500 border-b border-line">
            <th className="p-3">Nome</th>
            <th className="p-3">Bairro</th>
            <th className="p-3">Aniversário</th>
            <th className="p-3">Interesse</th>
            <th className="p-3">Localização</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {filtrados.map((e) => (
            <tr key={e.id} className="border-b border-paper-dim">
              <td className="p-3 font-semibold">{e.nome}</td>
              <td className="p-3">{e.bairro}</td>
              <td className="p-3">
                {formatarAniversario(e.data_nascimento)}
                {calcularIdade(e.data_nascimento) !== null && <span className="text-slate-500"> · {calcularIdade(e.data_nascimento)} anos</span>}
              </td>
              <td className="p-3">{e.interesse || '—'}</td>
              <td className="p-3">{e.lat ? '📍 Localizado' : '—'}</td>
              <td className="p-3 whitespace-nowrap">
                <button onClick={() => abrirEdicao(e)} className="border border-line px-2.5 py-1 text-xs font-semibold text-blue-600 mr-1.5">Editar</button>
                <button onClick={() => excluirEleitor(e.id)} className="border border-line px-2.5 py-1 text-xs font-semibold text-red-700">Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalAberto && (
        <div className="fixed inset-0 bg-navy-950/55 flex items-center justify-center z-50 p-5">
          <div className="bg-white w-full max-w-md border border-line p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">{editandoId ? 'Editar eleitor' : 'Novo eleitor'}</h3>
            <div className="space-y-3">
              <input placeholder="Nome completo *" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full border border-line px-3 py-2 text-sm" />
              <input placeholder="Bairro *" value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} className="w-full border border-line px-3 py-2 text-sm" />
              <input placeholder="Endereço (rua, número) — opcional" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} className="w-full border border-line px-3 py-2 text-sm" />
              <input placeholder="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className="w-full border border-line px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[9.5px] uppercase tracking-wide text-slate-500 mb-1">Data de nascimento</label>
                  <input type="date" value={form.dataNascimento} onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })} className="w-full border border-line px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block font-mono text-[9.5px] uppercase tracking-wide text-slate-500 mb-1">CPF</label>
                  <input placeholder="000.000.000-00" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} className="w-full border border-line px-3 py-2 text-sm" />
                </div>
              </div>
              <input placeholder="Tags (separadas por vírgula)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full border border-line px-3 py-2 text-sm" />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={fecharModal} className="border border-line px-4 py-2 text-sm font-semibold text-slate-500">Cancelar</button>
              <button onClick={salvarEleitor} disabled={salvando} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 text-sm font-semibold border border-blue-400 disabled:opacity-60">
                {salvando ? 'Salvando...' : 'Salvar eleitor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
