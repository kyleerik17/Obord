// The publishable key is designed for public clients; database access remains
// protected by Supabase RLS. Environment variables can override these defaults.
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://gfrskvitobldqrhejbxn.supabase.co',
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_Vi63FyoVCSfuHMMjLeA_9A_wkCPOwX8',
}

export function assertPublicEnv() {
  if (!env.supabaseUrl || !env.supabasePublishableKey) {
    throw new Error('Missing Supabase environment variables')
  }
}
