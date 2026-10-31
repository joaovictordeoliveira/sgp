import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Acao, Permissoes, podeEm } from '@/lib/modulos'

// Busca o usuário logado + perfil + permissões. Cacheado por requisição.
export const getContexto = cache(async () => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfis')
    .select('*, perfis_acesso(nome, permissoes)')
    .eq('id', user.id)
    .single()

  const isAdmin = perfil?.papel === 'administrador'
  const permissoes = ((perfil?.perfis_acesso as any)?.permissoes ?? {}) as Permissoes
  const ativo = perfil?.ativo !== false
  return { supabase, user, perfil, isAdmin, permissoes, ativo }
})

export type Contexto = Awaited<ReturnType<typeof getContexto>>

export function pode(ctx: Pick<Contexto, 'isAdmin' | 'permissoes'>, modulo: string, acao: Acao = 'ver') {
  return podeEm(ctx.isAdmin, ctx.permissoes, modulo, acao)
}

// Use no topo de cada página: manda para "sem acesso" se o perfil não tiver a permissão.
export async function exigir(modulo: string, acao: Acao = 'ver') {
  const ctx = await getContexto()
  if (!ctx.ativo || !pode(ctx, modulo, acao)) redirect('/dashboard/sem-acesso')
  return ctx
}

export async function exigirAdmin() {
  const ctx = await getContexto()
  if (!ctx.ativo || !ctx.isAdmin) redirect('/dashboard/sem-acesso')
  return ctx
}
