'use client'

import { useState } from 'react'
import { Aniversariante, MESES } from '@/lib/aniversarios'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function CalendarioAniversarios({ pessoas }: { pessoas: Aniversariante[] }) {
  const hoje = new Date()
  const [mes, setMes] = useState(hoje.getMonth() + 1) // 1-12
  const [ano, setAno] = useState(hoje.getFullYear())
  const [filtro, setFiltro] = useState<'todos' | 'eleitor' | 'atendimento'>('todos')
  const [diaAberto, setDiaAberto] = useState<number | null>(null)

  const visiveis = pessoas.filter((p) => p.mes === mes && (filtro === 'todos' || p.origem === filtro))

  const porDia: Record<number, Aniversariante[]> = {}
  for (const p of visiveis) {
    ;(porDia[p.dia] ||= []).push(p)
  }

  const primeiroDiaSemana = new Date(ano, mes - 1, 1).getDay()
  const diasNoMes = new Date(ano, mes, 0).getDate()
  const celulas: (number | null)[] = [
    ...Array(primeiroDiaSemana).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ]

  function mudarMes(delta: number) {
    let novoMes = mes + delta
    let novoAno = ano
    if (novoMes < 1) { novoMes = 12; novoAno-- }
    if (novoMes > 12) { novoMes = 1; novoAno++ }
    setMes(novoMes)
    setAno(novoAno)
    setDiaAberto(null)
  }

  const ehHoje = (dia: number) => dia === hoje.getDate() && mes === hoje.getMonth() + 1 && ano === hoje.getFullYear()
  const selecionados = diaAberto ? porDia[diaAberto] ?? [] : []

  return (
    <div className="space-y-4">
      <div className="bg-white border border-line/60 rounded-xl shadow-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => mudarMes(-1)} className="border border-line/70 rounded-lg px-3 py-1.5 text-sm hover:bg-paper-dim transition-base" aria-label="Mês anterior">‹</button>
          <div className="font-display font-bold text-lg w-48 text-center">{MESES[mes - 1]} {ano}</div>
          <button onClick={() => mudarMes(1)} className="border border-line/70 rounded-lg px-3 py-1.5 text-sm hover:bg-paper-dim transition-base" aria-label="Próximo mês">›</button>
        </div>
        <div className="flex gap-1.5">
          {([['todos', 'Todos'], ['eleitor', 'Eleitores'], ['atendimento', 'Atendimentos']] as const).map(([valor, rotulo]) => (
            <button
              key={valor}
              onClick={() => setFiltro(valor)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-base ${filtro === valor ? 'bg-navy-950 text-white' : 'border border-line/70 text-slate-500 hover:bg-paper-dim'}`}
            >
              {rotulo}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500">{visiveis.length} aniversariante(s) neste mês</div>
      </div>

      <div className="bg-white border border-line/60 rounded-xl shadow-card overflow-hidden">
        <div className="grid grid-cols-7 bg-paper-dim">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="p-2.5 text-center font-mono text-[10px] uppercase tracking-wide text-slate-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {celulas.map((dia, i) => {
            if (dia === null) return <div key={`vazio-${i}`} className="min-h-[92px] border-t border-l border-paper-dim bg-paper/40" />
            const lista = porDia[dia] ?? []
            return (
              <button
                key={dia}
                onClick={() => setDiaAberto(lista.length ? dia : null)}
                className={`min-h-[92px] border-t border-l border-paper-dim p-1.5 text-left align-top transition-base ${lista.length ? 'hover:bg-blue-50 cursor-pointer' : 'cursor-default'} ${diaAberto === dia ? 'bg-blue-50' : ''}`}
              >
                <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${ehHoje(dia) ? 'bg-amber text-navy-950' : 'text-slate-500'}`}>{dia}</div>
                {lista.slice(0, 2).map((p) => (
                  <div key={p.id} className={`text-[10.5px] leading-tight truncate rounded px-1 py-0.5 mb-0.5 ${p.origem === 'eleitor' ? 'bg-[#DEEAF6] text-[#1E4E85]' : 'bg-[#FBEFDD] text-[#8A5D1B]'}`}>
                    🎂 {p.nome.split(' ')[0]}
                  </div>
                ))}
                {lista.length > 2 && <div className="text-[10px] text-slate-500 px-1">+{lista.length - 2} mais</div>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#DEEAF6]" /> Eleitor</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#FBEFDD]" /> Atendimento</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber" /> Hoje</span>
      </div>

      {diaAberto && selecionados.length > 0 && (
        <div className="bg-white border border-line/60 rounded-xl shadow-card p-5">
          <h3 className="font-semibold text-sm mb-3">Aniversariantes de {String(diaAberto).padStart(2, '0')}/{String(mes).padStart(2, '0')}</h3>
          <div className="space-y-2">
            {selecionados.map((p) => (
              <div key={p.id} className="flex justify-between items-center text-sm border-b border-paper-dim last:border-0 pb-2 last:pb-0">
                <div>
                  <span className="font-semibold">{p.nome}</span>
                  <span className="text-slate-500"> · completa {ano - p.ano} anos</span>
                </div>
                <span className="text-xs text-slate-500">{p.origem === 'eleitor' ? 'Eleitor' : 'Atendimento'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
