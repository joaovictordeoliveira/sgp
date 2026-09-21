'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    setCarregando(false)
    if (error) {
      setErro('E-mail ou senha inválidos.')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-sm bg-white border border-line p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 border border-blue-400 flex items-center justify-center font-display font-extrabold text-xs text-blue-600">
            SGP
          </div>
          <div className="font-display font-bold text-sm leading-tight">
            Sistema de Gerenciamento
            <br />
            Parlamentar
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wide text-slate-500 mb-1">
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-line px-3 py-2 text-sm bg-paper focus:bg-white outline-none"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wide text-slate-500 mb-1">
              Senha
            </label>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full border border-line px-3 py-2 text-sm bg-paper focus:bg-white outline-none"
            />
          </div>

          {erro && <p className="text-red-700 text-xs">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-2.5 border border-blue-400 disabled:opacity-60"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
