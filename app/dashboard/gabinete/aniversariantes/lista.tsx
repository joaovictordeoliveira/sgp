'use client'

import { useState } from 'react'
import { Aniversariante, MESES, linkWhatsApp } from '@/lib/aniversarios'

export default function ListaAniversariantes({ pessoas }: { pessoas: Aniversariante[] }) {
  const hoje = new Date()
  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const anoAtual = hoje.getFullYear()

  const doMes = pessoas.filter((p) => p.mes === mes).sort((a, b) => a.dia - b.dia || a.nome.localeCompare(b.nome))
  const ehHoje = (p: Aniversariante) => p.dia === hoje.getDate() && p.mes === hoje.getMonth() + 1

  return (
    <div className="space-y-4">
      <div className="bg-white border border-line/60 rounded-xl shadow-card p-4 flex items-center justify-between flex-wrap gap-3">
        <select
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
          className="border border-line/70 px-3.5 py-2.5 text-sm rounded-lg outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15"
        >
          {MESES.map((nome, i) => <option key={nome} value={i + 1}>{nome}</option>)}
        </select>
        <div className="text-xs text-slate-500">{doMes.length} aniversariante(s)</div>
      </div>

      <div className="bg-white border border-line/60 rounded-xl shadow-card overflow-hidden">
        {doMes.length === 0 && <div className="p-8 text-center text-sm text-slate-500">Nenhum aniversariante em {MESES[mes - 1]}.</div>}
        {doMes.map((p) => {
          const wa = linkWhatsApp(p.telefone, p.nome)
          return (
            <div key={p.id} className={`flex items-center gap-4 px-5 py-3.5 border-b border-paper-dim last:border-0 ${ehHoje(p) ? 'bg-[#FBEFDD]/50' : ''}`}>
              <div className="w-12 text-center shrink-0">
                <div className="font-display text-xl font-extrabold leading-none">{String(p.dia).padStart(2, '0')}</div>
                <div className="font-mono text-[9.5px] uppercase text-slate-500">{MESES[p.mes - 1].slice(0, 3)}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">
                  {p.nome} {ehHoje(p) && <span className="ml-1.5 text-[10px] font-bold bg-amber text-navy-950 px-2 py-0.5 rounded-full">HOJE 🎉</span>}
                </div>
                <div className="text-xs text-slate-500">
                  Completa {anoAtual - p.ano} anos · {p.origem === 'eleitor' ? 'Eleitor' : 'Atendimento'}
                  {p.telefone ? ` · ${p.telefone}` : ''}
                </div>
              </div>
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="shrink-0 border border-line/70 px-3 py-1.5 text-xs font-semibold text-[#2C6B41] rounded-md hover:bg-[#E1EEE4] transition-base">
                  Enviar parabéns
                </a>
              ) : (
                <span className="shrink-0 text-[11px] text-slate-500">sem telefone</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
