import { getContexto } from '@/lib/permissoes'
import Sidebar from '@/components/Sidebar'
import AplicarTema from '@/components/AplicarTema'
import { PermissoesProvider } from '@/components/PermissoesProvider'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, perfil, isAdmin, permissoes, ativo } = await getContexto()

  if (!perfil || !ativo) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-bold mb-2">Conta sem acesso</h1>
          <p className="text-sm text-slate-500">Esta conta está desativada ou ainda não foi configurada. Fale com o administrador do sistema.</p>
        </div>
      </main>
    )
  }

  const { data: mandato } = await supabase.from('mandato').select('nome_gabinete, logo_url').eq('id', 1).maybeSingle()

  return (
    <PermissoesProvider isAdmin={isAdmin} permissoes={permissoes}>
      <AplicarTema tema={(perfil.preferencias as any)?.tema} />
      <div className="flex min-h-screen">
        <Sidebar nomeUsuario={perfil.nome ?? user.email ?? 'Usuário'} avatarUrl={perfil.avatar_url ?? null} isAdmin={isAdmin} permissoes={permissoes}
          gabinete={{ nome: mandato?.nome_gabinete ?? null, logo: mandato?.logo_url ?? null }} />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </PermissoesProvider>
  )
}
