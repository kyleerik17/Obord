// Pin the app to the Supabase project that contains public.events. The key is
// publishable by design; access to private data remains protected by RLS.
export const env = {
  supabaseUrl: 'https://gfrskvitobldqrhejbxn.supabase.co',
  supabasePublishableKey: 'sb_publishable_Vi63FyoVCSfuHMMjLeA_9A_wkCPOwX8',
}

export function assertPublicEnv() {
  if (!env.supabaseUrl || !env.supabasePublishableKey) {
    throw new Error('Missing Supabase environment variables')
  }
}
