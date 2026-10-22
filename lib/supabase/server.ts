import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { assertPublicEnv, env } from '@/lib/env'

export async function createClient() {
  assertPublicEnv()
  const cookieStore = await cookies()

  return createServerClient(env.supabaseUrl!, env.supabasePublishableKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components cannot write cookies; the Proxy refreshes them.
        }
      },
    },
  })
}
