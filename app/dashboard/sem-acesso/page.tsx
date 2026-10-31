import Link from 'next/link'

export default function SemAcesso() {
  return (
    <main className="p-8 max-w-xl">
      <div className="bg-white border border-line/60 rounded-xl shadow-card p-8 text-center">
        <div className="text-3xl mb-3">🔒</div>
        <h1 className="text-xl font-bold mb-2">Sem permissão</h1>
        <p className="text-sm text-slate-500 mb-5">Seu perfil de acesso não permite abrir esta área. Se você precisa dela, peça ao administrador para ajustar suas permissões.</p>
        <Link href="/dashboard" className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg inline-block">Voltar ao início</Link>
      </div>
    </main>
  )
}
