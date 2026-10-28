import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublishedBlogPost } from '@/lib/data/blog'

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
  const { slug } = await params
  const post = await getPublishedBlogPost(slug)
  if (!post) notFound()

  const paragraphs = post.content.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean)

  return (
    <main className="blog-article-page">
      <article className="blog-article">
        <Link href="/blog" className="blog-article-back">← Tous les articles</Link>
        <header className="blog-article-header"><p className="blog-eyebrow">LE JOURNAL O’BORD</p><time dateTime={post.published_at}>{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Africa/Abidjan' }).format(new Date(post.published_at))}</time><h1>{post.title}</h1><p>{post.excerpt}</p></header>
        {post.coverImageUrl && <img className="blog-article-cover" src={post.coverImageUrl} alt={`Illustration de ${post.title}`} />}
        <div className="blog-article-content">{paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
        <footer className="blog-article-footer"><p>Un mot à partager avec le collectif ?</p><Link href="/contact" className="button-primary">Écrire à O’BORD</Link></footer>
      </article>
    </main>
  )
}
