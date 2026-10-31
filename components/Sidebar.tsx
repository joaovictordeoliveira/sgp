'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NAV, Permissoes, podeEm } from '@/lib/modulos'

type Props = { nomeUsuario: string; avatarUrl: string | null; isAdmin: boolean; permissoes: Permissoes; gabinete: { nome: string | null; logo: string | null } }

export default function Sidebar({ nomeUsuario, avatarUrl, isAdmin, permissoes, gabinete }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menuAberto, setMenuAberto] = useState(false)

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const grupos = NAV.map((g) => ({
    ...g,
    itens: g.itens.filter((i) => i.sempre || (i.admin ? isAdmin : i.modulo ? podeEm(isAdmin, permissoes, i.modulo, 'ver') : false)),
  })).filter((g) => g.itens.length > 0)

  return (
    <aside className="bg-navy-950 text-white p-4 flex flex-col sticky top-0 h-screen overflow-y-auto w-[260px] shrink-0">
      <div className="flex items-center gap-2.5 pb-5 border-b border-navy-800 mb-3 px-1.5">
        {gabinete.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gabinete.logo} alt="" className="w-9 h-9 rounded-lg object-contain bg-white/95 p-0.5 shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-display font-extrabold text-xs text-white shadow-card shrink-0">SGP</div>
        )}
        <div className="font-display font-bold text-[13px] leading-tight">{gabinete.nome ?? <>Gerenciamento<br />Parlamentar</>}</div>
      </div>

      <nav className="flex-1">
        {grupos.map((g) => (
          <div key={g.grupo}>
            <div className="font-mono text-[9.5px] tracking-wide text-slate-500 uppercase px-2.5 pt-3.5 pb-1.5">{g.grupo}</div>
            {g.itens.map((item) => {
              const ativo = pathname === item.href
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium border-l-2 rounded-r-md ${ativo ? 'bg-navy-800 text-white border-amber' : 'text-slate-300 border-transparent hover:bg-navy-900 hover:text-white'}`}>
                  <span className="w-4 text-center text-sm shrink-0">{item.icon}</span>
                  <span className="leading-tight">{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="relative mt-4 pt-3 border-t border-navy-800">
        {menuAberto && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-navy-900 border border-navy-800 rounded-xl shadow-modal p-1.5 text-[13px]">
            <Link href="/dashboard/conta/perfil" onClick={() => setMenuAberto(false)} className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-navy-800 hover:text-white">Meus dados / Perfil</Link>
            <Link href="/dashboard/conta/seguranca" onClick={() => setMenuAberto(false)} className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-navy-800 hover:text-white">Segurança</Link>
            <Link href="/dashboard/conta/preferencias" onClick={() => setMenuAberto(false)} className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-navy-800 hover:text-white">Preferências</Link>
            <button onClick={sair} className="w-full text-left px-3 py-2 rounded-lg text-red-300 hover:bg-navy-800">Sair (Logout)</button>
          </div>
        )}
        <button onClick={() => setMenuAberto((v) => !v)} className="w-full flex items-center gap-2.5 px-1 py-1 rounded-lg hover:bg-navy-900 text-left">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="w-[32px] h-[32px] rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-[32px] h-[32px] rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-bold shrink-0">{nomeUsuario.slice(0, 2).toUpperCase()}</div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate">{nomeUsuario}</div>
            <div className="text-[10.5px] text-slate-500">{isAdmin ? 'Administrador' : 'Minha conta'}</div>
          </div>
          <span className="text-slate-500 text-[10px]">{menuAberto ? '▼' : '▲'}</span>
        </button>
      </div>
    </aside>
  )
}
