'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Segmento = { id: string; nome: string; filtros: any; criado_em: string }

export default function SegmentacaoTool({ bairros, totalEleitores, segmentosIniciais }: { bairros: string[]; totalEleitores: number; segmentosIniciais: Segmento[] }) {
  const supabase = createClient()
  const [bairro, setBairro] = useState('')
  const [contagem, setContagem] = useState<number | null>(null)
  const [nomeSegmento, setNomeSegmento] = useState('')
  const [segmentos, setSegmentos] = useState<Segmento[]>(segmentosIniciais)
  const [buscando, setBuscando] = useState(false)

  const [canais, setCanais] = useState<string[]>(['whatsapp'])
  const [mensagem, setMensagem] = useState('')
  const [nomeCampanha, setNomeCampanha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resultadoEnvio, setResultadoEnvio] = useState<any>(null)

  function toggleCanal(c: string) {
    setCanais((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  async function dispararCampanha() {
    if (!mensagem.trim() || !nomeCampanha.trim() || canais.length === 0) return
    setEnviando(true)
    setResultadoEnvio(null)
    const res = await fetch('/api/comunicacao/enviar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canais, bairro: bairro || undefined, mensagem, assunto: nomeCampanha, campanhaNome: nomeCampanha }),
    })
    const json = await res.json()
    setEnviando(false)
    setResultadoEnvio(json)
  }

  async function buscarContagem() {
    setBuscando(true)
    let query = supabase.from('eleitores').select('id', { count: 'exact', head: true })
    if (bairro) query = query.eq('bairro', bairro)
    const { count } = await query
    setContagem(count ?? 0)
    setBuscando(false)
  }

  async function salvarSegmento() {
    if (!nomeSegmento.trim()) return
    const filtros = { bairro: bairro || null }
    const { data, error } = await supabase.from('segmentos').insert({ nome: nomeSegmento, filtros }).select().single()
    if (!error && data) {
      setSegmentos((prev) => [data as Segmento, ...prev])
      setNomeSegmento('')
    }
  }

  async function excluirSegmento(id: string) {
    const { error } = await supabase.from('segmentos').delete().eq('id', id)
    if (!error) setSegmentos((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-line p-5">
        <h3 className="font-semibold text-sm mb-3">Disparar campanha</h3>
        <div className="flex gap-4 mb-3 text-sm">
          {['whatsapp', 'sms', 'email'].map((c) => (
            <label key={c} className="flex items-center gap-1.5">
              <input type="checkbox" checked={canais.includes(c)} onChange={() => toggleCanal(c)} />
              {c === 'whatsapp' ? 'WhatsApp' : c.toUpperCase()}
            </label>
          ))}
        </div>
        <input placeholder="Nome da campanha *" value={nomeCampanha} onChange={(e) => setNomeCampanha(e.target.value)} className="w-full border border-line px-3 py-2 text-sm mb-2.5" />
        <textarea placeholder="Mensagem *" value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={4} className="w-full border border-line px-3 py-2 text-sm mb-2.5" />
        <p className="text-xs text-slate-500 mb-3">
          Será enviado para {bairro ? `eleitores de "${bairro}"` : 'todos os eleitores cadastrados'} que tenham telefone/e-mail salvo.
        </p>
        <button onClick={dispararCampanha} disabled={enviando} className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 border border-blue-400 disabled:opacity-60">
          {enviando ? 'Enviando...' : 'Disparar agora'}
        </button>

        {resultadoEnvio && (
          <div className="mt-4 bg-paper-dim p-3.5 text-xs space-y-1">
            {resultadoEnvio.error ? (
              <p className="text-red-700">{resultadoEnvio.error}</p>
            ) : (
              <>
                <p>Total de destinatários encontrados: <b>{resultadoEnvio.totalDestinatarios}</b></p>
                {canais.includes('whatsapp') && <p>WhatsApp: {resultadoEnvio.resultado.whatsapp.enviados} enviados, {resultadoEnvio.resultado.whatsapp.falhas} falhas</p>}
                {canais.includes('sms') && <p>SMS: {resultadoEnvio.resultado.sms.enviados} enviados, {resultadoEnvio.resultado.sms.falhas} falhas</p>}
                {canais.includes('email') && <p>E-mail: {resultadoEnvio.resultado.email.enviados} enviados, {resultadoEnvio.resultado.email.falhas} falhas</p>}
              </>
            )}
          </div>
        )}
      </div>

      <div className="bg-white border border-line p-5">
        <h3 className="font-semibold text-sm mb-3">Construtor de segmento</h3>
        <div className="flex gap-2.5 flex-wrap items-end mb-4">
          <select value={bairro} onChange={(e) => { setBairro(e.target.value); setContagem(null) }} className="border border-line px-3 py-2 text-sm">
            <option value="">Todos os bairros ({totalEleitores})</option>
            {bairros.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <button onClick={buscarContagem} disabled={buscando} className="border border-line px-4 py-2 text-sm font-semibold text-blue-600">
            {buscando ? 'Contando...' : 'Ver quantos eleitores'}
          </button>
        </div>
        {contagem !== null && (
          <div className="bg-paper-dim p-4 flex justify-between items-center flex-wrap gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase text-slate-500">Contatos encontrados</div>
              <div className="font-display text-2xl font-extrabold text-blue-600">{contagem}</div>
            </div>
            <div className="flex gap-2">
              <input placeholder="Nome da lista" value={nomeSegmento} onChange={(e) => setNomeSegmento(e.target.value)} className="border border-line px-3 py-2 text-sm" />
              <button onClick={salvarSegmento} className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 border border-blue-400">Salvar lista</button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-line">
        <div className="p-4 border-b border-line font-semibold text-sm">Listas salvas</div>
        <div className="p-4">
          {segmentos.length === 0 && <div className="text-sm text-slate-500 text-center py-4">Nenhuma lista salva ainda.</div>}
          {segmentos.map((s) => (
            <div key={s.id} className="flex justify-between items-center py-2.5 border-b border-paper-dim last:border-0">
              <div>
                <div className="text-sm font-semibold">{s.nome}</div>
                <div className="text-xs text-slate-500">{s.filtros?.bairro ? `Bairro: ${s.filtros.bairro}` : 'Todos os bairros'}</div>
              </div>
              <button onClick={() => excluirSegmento(s.id)} className="border border-line px-2.5 py-1 text-xs font-semibold text-red-700">Excluir</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
