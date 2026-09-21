'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { group: 'Geral', items: [{ href: '/dashboard', label: 'Visão geral', icon: '◆' }] },
  { group: 'Território', items: [{ href: '/dashboard/territorio', label: 'Mapa eleitoral', icon: '◈' }, { href: '/dashboard/eleitores', label: 'Base de eleitores', icon: '▤' }] },
  { group: 'Campo', items: [{ href: '/dashboard/campo', label: 'Equipe de rua', icon: '▲' }] },
  { group: 'Comunicação', items: [{ href: '/dashboard/comunicacao', label: 'Disparos e segmentação', icon: '✉' }] },
  { group: 'Gabinete', items: [
    { href: '/dashboard/gabinete/atendimentos', label: 'Atendimento ao cidadão', icon: '☎' },
    { href: '/dashboard/gabinete/documentos', label: 'Documentos & ofícios', icon: '▦' },
    { href: '/dashboard/gabinete/proposicoes', label: 'Proposições', icon: '§' },
  ]},
  { group: 'Gestão', items: [
    { href: '/dashboard/gestao/financeiro', label: 'Financeiro', icon: '$' },
    { href: '/dashboard/gestao/agenda', label: 'Agenda', icon: '◷' },
  ]},
]

export default function Sidebar({ nomeUsuario }: { nomeUsuario: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="bg-navy-950 text-white p-4 flex flex-col sticky top-0 h-screen overflow-y-auto w-[250px] shrink-0">
      <div className="flex items-center gap-2.5 pb-5 border-b border-navy-800 mb-4 px-1.5">
        <div className="w-8 h-8 border border-blue-400 flex items-center justify-center font-display font-extrabold text-xs text-blue-400 relative shrink-0">
          SGP
        </div>
        <div className="font-display font-bold text-[13px] leading-tight">
          Gerenciamento
          <br />
          Parlamentar
        </div>
      </div>

      {NAV.map((group) => (
        <div key={group.group}>
          <div className="font-mono text-[10px] tracking-wide text-slate-500 uppercase px-2.5 pt-3.5 pb-1.5">
            {group.group}
          </div>
          {group.items.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-2.5 py-2.5 text-[13.5px] font-medium border-l-2 ${
                  active
                    ? 'bg-navy-800 text-white border-amber'
                    : 'text-slate-300 border-transparent hover:bg-navy-900 hover:text-white'
                }`}
              >
                <span className="w-4 text-center text-sm shrink-0">{item.icon}</span> {item.label}
              </Link>
            )
          })}
        </div>
      ))}

      <div className="mt-auto pt-3.5 border-t border-navy-800 flex items-center gap-2.5 px-1">
        <div className="w-[30px] h-[30px] rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-bold shrink-0">
          {nomeUsuario.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate">{nomeUsuario}</div>
          <button onClick={sair} className="text-[10.5px] text-slate-500 hover:text-white">
            Sair
          </button>
        </div>
      </div>
    </aside>
  )
}
