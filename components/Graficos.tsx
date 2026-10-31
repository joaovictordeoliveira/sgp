// Gráficos simples em CSS (sem biblioteca externa)
type Dado = { rotulo: string; valor: number; texto?: string }

export function BarrasVerticais({ dados, cor = '#3E72C0' }: { dados: Dado[]; cor?: string }) {
  const max = Math.max(1, ...dados.map((d) => d.valor))
  return (
    <div className="flex items-end gap-3 h-40 pt-4">
      {dados.map((d) => (
        <div key={d.rotulo} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
          <div className="text-[11px] font-semibold mb-1">{d.texto ?? d.valor}</div>
          <div className="w-full rounded-t-md" style={{ height: `${(d.valor / max) * 100}%`, minHeight: d.valor > 0 ? 4 : 1, backgroundColor: cor }} />
          <div className="font-mono text-[10px] text-slate-500 mt-1.5 truncate w-full text-center">{d.rotulo}</div>
        </div>
      ))}
    </div>
  )
}

export function BarrasHorizontais({ dados, cor = '#3E72C0' }: { dados: Dado[]; cor?: string }) {
  const max = Math.max(1, ...dados.map((d) => d.valor))
  if (dados.length === 0) return <div className="text-sm text-slate-500 py-4 text-center">Sem dados ainda.</div>
  return (
    <div className="space-y-2.5">
      {dados.map((d) => (
        <div key={d.rotulo}>
          <div className="flex justify-between text-xs mb-1"><span className="font-medium truncate pr-2">{d.rotulo}</span><span className="text-slate-500 shrink-0">{d.texto ?? d.valor}</span></div>
          <div className="h-2 bg-paper-dim rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(d.valor / max) * 100}%`, backgroundColor: cor }} /></div>
        </div>
      ))}
    </div>
  )
}
