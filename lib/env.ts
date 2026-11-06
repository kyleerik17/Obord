export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim(),
}

export function assertPublicEnv() {
  if (!env.supabaseUrl || !env.supabasePublishableKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  }

  try {
    const url = new URL(env.supabaseUrl)
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co')) {
      throw new Error('Invalid Supabase project URL')
    }
  } catch {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid https://<project>.supabase.co URL')
  }
}
