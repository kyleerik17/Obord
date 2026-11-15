import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublishedBlogPost } from '@/lib/data/blog'
import { getLocale } from '@/lib/i18n-server'
import { translate } from '@/lib/i18n'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedBlogPost(slug)
  if (!post) return { title: 'Article introuvable | O’BORD' }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.published_at,
      ...(post.coverImageUrl ? { images: [{ url: post.coverImageUrl, alt: `Miniature de ${post.title}` }] } : {}),
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()])
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)
  const post = await getPublishedBlogPost(slug)
  if (!post) notFound()

  const paragraphs = post.content.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean)

  return (
    <div className="blog-article-page">
      <article className="blog-article">
        <Link href="/blog" className="blog-article-back">{t('blog.return')}</Link>
        <header className="blog-article-header"><p className="blog-eyebrow">O’BORD · JOURNAL</p><time dateTime={post.published_at}>{new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : locale === 'es' ? 'es-ES' : 'fr-FR', { dateStyle: 'long', timeZone: 'Africa/Abidjan' }).format(new Date(post.published_at))}</time><h1>{post.title}</h1><p>{post.excerpt}</p></header>
        {post.coverImageUrl && <Image className="blog-article-cover" src={post.coverImageUrl} alt={`Illustration de ${post.title}`} width={1200} height={675} sizes="(max-width: 900px) 100vw, 900px" />}
        <div className="blog-article-content">{paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
        <footer className="blog-article-footer"><p>{t('blog.articleFooter')}</p><Link href="/contact" className="button-primary">{t('home.contactCta')}</Link></footer>
      </article>
    </div>
  )
}
