'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Evento = { id: string; titulo: string; data: string; hora: string | null; local: string | null }

export default function AgendaList({ dadosIniciais }: { dadosIniciais: Evento[] }) {
  const supabase = createClient()
  const [itens, setItens] = useState<Evento[]>(dadosIniciais)
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState({ titulo: '', data: '', hora: '', local: '' })

  async function salvar() {
    if (!form.titulo.trim() || !form.data) return
    const { data, error } = await supabase.from('eventos_agenda').insert(form).select().single()
    if (!error && data) {
      setItens((prev) => [...prev, data as Evento].sort((a, b) => a.data.localeCompare(b.data)))
      setForm({ titulo: '', data: '', hora: '', local: '' })
      setModalAberto(false)
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este evento?')) return
    const { error } = await supabase.from('eventos_agenda').delete().eq('id', id)
    if (!error) setItens((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="bg-white border border-line">
      <div className="flex justify-between items-center p-4 border-b border-line">
        <h3 className="font-semibold text-sm">Próximos eventos</h3>
        <button onClick={() => setModalAberto(true)} className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 border border-blue-400">+ Novo evento</button>
      </div>
      <div className="p-4">
        {itens.length === 0 && <div className="text-sm text-slate-500 text-center py-6">Nenhum evento cadastrado.</div>}
        {itens.map((ev) => (
          <div key={ev.id} className="flex justify-between items-center py-2.5 border-b border-paper-dim last:border-0">
            <div className="flex gap-3">
              <div className="font-mono text-xs text-blue-600 w-24 shrink-0">{ev.data.split('-').reverse().join('/')} {ev.hora?.slice(0, 5)}</div>
              <div><div className="text-sm font-semibold">{ev.titulo}</div><div className="text-xs text-slate-500">{ev.local}</div></div>
            </div>
            <button onClick={() => excluir(ev.id)} className="border border-line px-2.5 py-1 text-xs font-semibold text-red-700">Excluir</button>
          </div>
        ))}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-navy-950/55 flex items-center justify-center z-50 p-5">
          <div className="bg-white w-full max-w-md border border-line p-6">
            <h3 className="font-bold text-lg mb-4">Novo evento</h3>
            <div className="space-y-3">
              <input placeholder="Título *" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="w-full border border-line px-3 py-2 text-sm" />
              <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className="w-full border border-line px-3 py-2 text-sm" />
              <input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} className="w-full border border-line px-3 py-2 text-sm" />
              <input placeholder="Local" value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} className="w-full border border-line px-3 py-2 text-sm" />
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
