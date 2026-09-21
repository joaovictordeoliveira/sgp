import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('perfis').select('nome').eq('id', user.id).single()

  return (
    <div className="grid grid-cols-[250px_1fr] min-h-screen">
      <Sidebar nomeUsuario={perfil?.nome ?? user.email ?? 'Usuário'} />
      <div className="max-w-[1280px]">{children}</div>
    </div>
  )
}
