'use client'

export type Etiqueta = { id: string; nome: string; cor: string }

export default function SeletorEtiquetas({ etiquetas, valor, onChange }: { etiquetas: Etiqueta[]; valor: string[]; onChange: (v: string[]) => void }) {
  const nomes = [...etiquetas.map((e) => e.nome), ...valor.filter((v) => !etiquetas.some((e) => e.nome === v))]
  if (nomes.length === 0) {
    return <p className="text-xs text-slate-500">Nenhuma etiqueta cadastrada ainda. Crie em Configurações → Etiquetas &amp; Categorias.</p>
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {nomes.map((n) => {
        const cor = etiquetas.find((e) => e.nome === n)?.cor ?? '#5B6B82'
        const ativo = valor.includes(n)
        return (
          <button type="button" key={n} onClick={() => onChange(ativo ? valor.filter((x) => x !== n) : [...valor, n])}
            style={ativo ? { backgroundColor: cor, color: '#fff', borderColor: cor } : { borderColor: cor, color: cor }}
            className="text-xs font-semibold px-2.5 py-1 rounded-full border transition-base">{n}</button>
        )
      })}
    </div>
  )
}

export function ChipsEtiquetas({ nomes, etiquetas }: { nomes: string[] | null; etiquetas: Etiqueta[] }) {
  if (!nomes || nomes.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {nomes.map((n) => {
        const cor = etiquetas.find((e) => e.nome === n)?.cor ?? '#5B6B82'
        return <span key={n} style={{ backgroundColor: cor + '22', color: cor }} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full">{n}</span>
      })}
    </div>
  )
}
