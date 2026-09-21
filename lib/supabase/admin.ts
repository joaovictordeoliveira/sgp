import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// ATENÇÃO: este cliente usa a service role key, que ignora RLS.
// Use SOMENTE dentro de app/api/**/route.ts (código de servidor).
// NUNCA importe este arquivo em um componente 'use client'.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
