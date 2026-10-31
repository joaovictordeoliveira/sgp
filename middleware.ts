import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) { response.cookies.set({ name, value, ...options }) },
        remove(name: string, options: CookieOptions) { response.cookies.set({ name, value: '', ...options }) },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const ehLogin = request.nextUrl.pathname.startsWith('/login')

  // Quem ativou 2FA e só digitou a senha (nível aal1) ainda NÃO está logado de verdade.
  let faltaSegundoFator = false
  if (user) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    faltaSegundoFator = aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2'
  }

  const redirecionar = (caminho: string) => {
    const url = request.nextUrl.clone()
    url.pathname = caminho
    return NextResponse.redirect(url)
  }

  if (!user && !ehLogin) return redirecionar('/login')
  if (user && faltaSegundoFator && !ehLogin) return redirecionar('/login')
  if (user && !faltaSegundoFator && ehLogin) return redirecionar('/dashboard')
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)'],
}
