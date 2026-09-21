'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Documento = {
  id: string
  numero: string
  tipo: string
  destinatario: string
  assunto: string
  status: string
  data: string
  arquivo_url: string | null
}

const STATUS_OPTIONS = ['Rascunho', 'Protocolado', 'Em análise', 'Respondido', 'Arquivado']
const STATUS_CLASSES: Record<string, string> = {
  'Rascunho': 'bg-[#EDF1F6] text-[#5B6B82]',
  'Protocolado': 'bg-[#FBEFDD] text-[#8A5D1B]',
  'Em análise': 'bg-[#DEEAF6] text-[#1E4E85]',
  'Respondido': 'bg-[#E1EEE4] text-[#2C6B41]',
  'Arquivado': 'bg-[#F4E1DE] text-[#963B2A]',
}

export default function DocumentosTable({ dadosIniciais }: { dadosIniciais: Documento[] }) {
  const supabase = createClient()
  const [itens, setItens] = useState<Documento[]>(dadosIniciais)
  const [tipo, setTipo] = useState('Ofício')
  const [destinatario, setDestinatario] = useState('')
  const [assunto, setAssunto] = useState('')
  const [gerando, setGerando] = useState(false)

  function proximoNumero() {
    const nums = itens.map((d) => parseInt(d.numero.split('/')[0], 10)).filter((n) => !isNaN(n))
    const max = nums.length ? Math.max(...nums) : 0
    return String(max + 1).padStart(4, '0') + '/' + new Date().getFullYear()
  }

  async function gerar() {
    if (!destinatario.trim() || !assunto.trim()) return
    setGerando(true)
    const novo = { numero: proximoNumero(), tipo, destinatario, assunto, status: 'Protocolado' }
    const { data, error } = await supabase.from('documentos').insert(novo).select().single()
    setGerando(false)
    if (!error && data) {
      setItens((prev) => [data as Documento, ...prev])
      setDestinatario('')
      setAssunto('')
    }
  }

  async function atualizarStatus(id: string, status: string) {
    const { error } = await supabase.from('documentos').update({ status }).eq('id', id)
    if (!error) setItens((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)))
  }

  const [gerandoPdfId, setGerandoPdfId] = useState<string | null>(null)

  async function gerarPdf(id: string) {
    setGerandoPdfId(id)
    const res = await fetch('/api/documentos/gerar-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentoId: id }),
    })
    const json = await res.json()
    setGerandoPdfId(null)
    if (json.url) {
      setItens((prev) => prev.map((i) => (i.id === id ? { ...i, arquivo_url: json.url } : i)))
      window.open(json.url, '_blank')
    } else {
      alert(json.error ?? 'Erro ao gerar PDF.')
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este documento?')) return
    const { error } = await supabase.from('documentos').delete().eq('id', id)
    if (!error) setItens((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-line p-4 flex gap-2.5 flex-wrap items-end">
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="border border-line px-2.5 py-2 text-xs">
          <option>Ofício</option><option>Requerimento</option><option>Indicação</option><option>Moção</option>
        </select>
        <input placeholder="Destinatário / órgão" value={destinatario} onChange={(e) => setDestinatario(e.target.value)} className="border border-line px-2.5 py-2 text-xs min-w-[220px]" />
        <input placeholder="Assunto" value={assunto} onChange={(e) => setAssunto(e.target.value)} className="border border-line px-2.5 py-2 text-xs min-w-[220px]" />
        <button onClick={gerar} disabled={gerando} className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-4 py-2 border border-blue-400 disabled:opacity-60">
          {gerando ? 'Gerando...' : 'Gerar documento'}
        </button>
      </div>

      <div className="bg-white border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left font-mono text-[10px] uppercase tracking-wide text-slate-500 border-b border-line">
              <th className="p-3">Documento</th><th className="p-3">Destinatário</th><th className="p-3">Assunto</th><th className="p-3">Status</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {itens.map((d) => (
              <tr key={d.id} className="border-b border-paper-dim">
                <td className="p-3 font-semibold">{d.tipo} nº {d.numero}</td>
                <td className="p-3">{d.destinatario}</td>
                <td className="p-3">{d.assunto}</td>
                <td className="p-3">
                  <select value={d.status} onChange={(e) => atualizarStatus(d.id, e.target.value)} className={`text-xs font-semibold border-none px-2 py-1 ${STATUS_CLASSES[d.status]}`}>
                    {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <button onClick={() => gerarPdf(d.id)} disabled={gerandoPdfId === d.id} className="border border-line px-2.5 py-1 text-xs font-semibold text-blue-600 mr-1.5 disabled:opacity-60">
                    {gerandoPdfId === d.id ? 'Gerando...' : d.arquivo_url ? 'Ver PDF' : 'Gerar PDF'}
                  </button>
                  <button onClick={() => excluir(d.id)} className="border border-line px-2.5 py-1 text-xs font-semibold text-red-700">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
