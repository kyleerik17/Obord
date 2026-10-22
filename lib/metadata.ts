import type { Metadata } from 'next'

export function getPublicSiteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url : undefined
  } catch {
    return undefined
  }
}

export function pageMetadata(title: string, description: string): Metadata {
  const siteUrl = getPublicSiteUrl()
  return {
    title,
    description,
    ...(siteUrl ? { metadataBase: siteUrl } : {}),
    openGraph: {
      title,
      description,
      siteName: 'O’BORD',
      locale: 'fr_CI',
      type: 'website',
      ...(siteUrl ? { images: [{ url: `${siteUrl}/obord-logo.png`, width: 600, height: 600, alt: 'Logo O’BORD' }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(siteUrl ? { images: [`${siteUrl}/obord-logo.png`] } : {}),
    },
  }
}
