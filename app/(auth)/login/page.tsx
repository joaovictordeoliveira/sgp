'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [codigo, setCodigo] = useState('')
  const [fatorId, setFatorId] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro(''); setCarregando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) { setCarregando(false); setErro('E-mail ou senha inválidos.'); return }
    // Se a conta tem 2FA, pede o código antes de entrar
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2') {
      const { data: fatores } = await supabase.auth.mfa.listFactors()
      const totp = fatores?.totp?.[0]
      setCarregando(false)
      if (!totp) { setErro('Não foi possível carregar o 2FA desta conta.'); return }
      setFatorId(totp.id)
      return
    }
    router.push('/dashboard'); router.refresh()
  }

  async function confirmarCodigo(e: React.FormEvent) {
    e.preventDefault()
    if (!fatorId) return
    setErro(''); setCarregando(true)
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: fatorId, code: codigo.trim() })
    setCarregando(false)
    if (error) { setErro('Código inválido ou expirado. Tente de novo.'); return }
    router.push('/dashboard'); router.refresh()
  }

  async function voltar() {
    await supabase.auth.signOut()
    setFatorId(null); setCodigo(''); setSenha(''); setErro('')
  }

  const campo = 'w-full border border-line/70 px-3.5 py-2.5 text-sm rounded-lg bg-paper outline-none transition-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15 focus:bg-white'

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-sm bg-white border border-line/60 rounded-xl shadow-card p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-display font-extrabold text-xs text-white shadow-card">SGP</div>
          <div className="font-display font-bold text-sm leading-tight">Sistema de Gerenciamento<br />Parlamentar</div>
        </div>
        {!fatorId ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="block font-mono text-[10px] uppercase tracking-wide text-slate-500 mb-1">E-mail</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={campo} /></div>
            <div><label className="block font-mono text-[10px] uppercase tracking-wide text-slate-500 mb-1">Senha</label><input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} className={campo} /></div>
            {erro && <p className="text-red-700 text-xs">{erro}</p>}
            <button type="submit" disabled={carregando} className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm text-sm font-semibold py-2.5 disabled:opacity-60">{carregando ? 'Entrando...' : 'Entrar'}</button>
          </form>
        ) : (
          <form onSubmit={confirmarCodigo} className="space-y-4">
            <p className="text-sm text-slate-500">Digite o código de 6 dígitos do seu aplicativo autenticador.</p>
            <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} required autoFocus value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))} className={campo + ' text-center tracking-[0.4em] text-lg'} placeholder="000000" />
            {erro && <p className="text-red-700 text-xs">{erro}</p>}
            <button type="submit" disabled={carregando || codigo.length !== 6} className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm text-sm font-semibold py-2.5 disabled:opacity-60">{carregando ? 'Verificando...' : 'Confirmar'}</button>
            <button type="button" onClick={voltar} className="w-full text-xs text-slate-500 hover:text-ink">Voltar</button>
          </form>
        )}
      </div>
    </div>
  )
}
