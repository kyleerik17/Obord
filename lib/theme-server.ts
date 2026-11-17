import { cookies } from 'next/headers'

export type Theme = 'light' | 'dark'

export async function getTheme(): Promise<Theme> {
  const value = (await cookies()).get('obord-theme')?.value
  return value === 'light' ? 'light' : 'dark'
}
