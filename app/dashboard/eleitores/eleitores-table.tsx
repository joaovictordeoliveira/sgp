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
}

export default function EleitoresTable({ eleitoresIniciais }: { eleitoresIniciais: Eleitor[] }) {
  const supabase = createClient()
  const [eleitores, setEleitores] = useState<Eleitor[]>(eleitoresIniciais)
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ nome: '', telefone: '', bairro: '', endereco: '', interesse: '', tags: '' })

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

  async function salvarEleitor() {
    if (!form.nome.trim() || !form.bairro.trim()) return
    setSalvando(true)

    const { lat, lng } = form.endereco
      ? await geocodificar(form.endereco, form.bairro)
      : { lat: null, lng: null }

    const { data, error } = await supabase
      .from('eleitores')
      .insert({
        nome: form.nome,
        telefone: form.telefone || null,
        bairro: form.bairro,
        endereco: form.endereco || null,
        lat,
        lng,
        interesse: form.interesse || null,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      })
      .select()
      .single()

    setSalvando(false)
    if (!error && data) {
      setEleitores((prev) => [data as Eleitor, ...prev])
      setForm({ nome: '', telefone: '', bairro: '', endereco: '', interesse: '', tags: '' })
      setModalAberto(false)
    }
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
        <button
          onClick={() => setModalAberto(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 border border-blue-400"
        >
          + Novo eleitor
        </button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left font-mono text-[10px] uppercase tracking-wide text-slate-500 border-b border-line">
            <th className="p-3">Nome</th>
            <th className="p-3">Bairro</th>
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
              <td className="p-3">{e.interesse || '—'}</td>
              <td className="p-3">{e.lat ? '📍 Localizado' : '—'}</td>
              <td className="p-3">
                <button
                  onClick={() => excluirEleitor(e.id)}
                  className="border border-line px-2.5 py-1 text-xs font-semibold text-red-700"
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalAberto && (
        <div className="fixed inset-0 bg-navy-950/55 flex items-center justify-center z-50 p-5">
          <div className="bg-white w-full max-w-md border border-line p-6">
            <h3 className="font-bold text-lg mb-4">Novo eleitor</h3>
            <div className="space-y-3">
              <input
                placeholder="Nome completo *"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="w-full border border-line px-3 py-2 text-sm"
              />
              <input
                placeholder="Bairro *"
                value={form.bairro}
                onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                className="w-full border border-line px-3 py-2 text-sm"
              />
              <input
                placeholder="Endereço (rua, número) — opcional"
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                className="w-full border border-line px-3 py-2 text-sm"
              />
              <input
                placeholder="Telefone"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                className="w-full border border-line px-3 py-2 text-sm"
              />
              <input
                placeholder="Tags (separadas por vírgula)"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="w-full border border-line px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setModalAberto(false)} className="border border-line px-4 py-2 text-sm font-semibold text-slate-500">
                Cancelar
              </button>
              <button
                onClick={salvarEleitor}
                disabled={salvando}
                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 text-sm font-semibold border border-blue-400 disabled:opacity-60"
              >
                {salvando ? 'Salvando...' : 'Salvar eleitor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
