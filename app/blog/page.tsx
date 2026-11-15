import Link from 'next/link'
import Image from 'next/image'
import { pageMetadata } from '@/lib/metadata'
import { getPublishedBlogPosts } from '@/lib/data/blog'
import { getLocale } from '@/lib/i18n-server'
import { translate } from '@/lib/i18n'

export const metadata = pageMetadata('Le blog', 'Les nouvelles, les histoires et les coulisses du collectif O’BORD à Grand-Bassam.')

export default async function BlogPage() {
  const [{ posts, error }, locale] = await Promise.all([getPublishedBlogPosts(), getLocale()])
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)
  const dateLocale = locale === 'en' ? 'en-GB' : locale === 'es' ? 'es-ES' : 'fr-FR'

  return (
    <div className="blog-page">
      <header className="blog-hero">
        <p className="blog-eyebrow">O’BORD · GRAND-BASSAM</p>
        <h1>{t('blog.heading')}</h1>
        <p>{t('blog.intro')}</p>
      </header>
      <section className="blog-content" aria-labelledby="blog-list-title">
        <div className="blog-heading"><div><p className="event-practical-label">{t('blog.reading')}</p><h2 id="blog-list-title">{t('blog.title')}</h2></div><span>{String(posts.length).padStart(2, '0')} {t('blog.articleCount')}</span></div>
        {error ? <section className="blog-empty"><h3>{t('blog.error')}</h3><p>{t('blog.retry')}</p></section> : posts.length ? (
          <div className="blog-grid">
            {posts.map((post) => (
              <article className="blog-card" key={post.id}>
                <Link href={`/blog/${encodeURIComponent(post.slug)}`} className="blog-card-link" aria-label={`Lire l’article : ${post.title}`}>
                  {post.coverImageUrl ? <Image className="blog-card-cover" src={post.coverImageUrl} alt={`Miniature de l’article ${post.title}`} width={800} height={500} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" /> : <div className="blog-card-placeholder" aria-hidden="true"><span>O’BORD</span></div>}
                  <div className="blog-card-copy"><time dateTime={post.published_at}>{new Intl.DateTimeFormat(dateLocale, { dateStyle: 'long', timeZone: 'Africa/Abidjan' }).format(new Date(post.published_at))}</time><h3>{post.title}</h3><p>{post.excerpt}</p><span className="blog-read-link">{t('blog.read')}</span></div>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <section className="blog-empty"><h3>{t('blog.empty')}</h3><p>{t('blog.emptyText')}</p></section>
        )}
        <div className="blog-back"><Link href="/">{t('common.home')}</Link></div>
      </section>
    </div>
  )
}
