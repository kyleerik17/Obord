import { createBrowserClient } from '@supabase/ssr'
import { assertPublicEnv, env } from './env'

let browserClient: ReturnType<typeof createBrowserClient> | undefined

export function getSupabaseBrowserClient() {
  assertPublicEnv()
  browserClient ??= createBrowserClient(env.supabaseUrl!, env.supabasePublishableKey!)
  return browserClient
}
