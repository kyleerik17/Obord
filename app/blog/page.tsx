import Link from 'next/link'
import { pageMetadata } from '@/lib/metadata'
import { getPublishedBlogPosts } from '@/lib/data/blog'

export const metadata = pageMetadata('Le blog', 'Les nouvelles, les histoires et les coulisses du collectif O’BORD à Grand-Bassam.')

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Africa/Abidjan' }).format(new Date(value))
}

export default async function BlogPage() {
  const { posts, error } = await getPublishedBlogPosts()

  return (
    <main className="blog-page">
      <header className="blog-hero">
        <p className="blog-eyebrow">O’BORD · LE JOURNAL DU COLLECTIF</p>
        <h1>Des nouvelles<br /><span>de la maison.</span></h1>
        <p>Des histoires, des idées de jeux et les coulisses des moments qu’on partage à Grand-Bassam.</p>
      </header>
      <section className="blog-content" aria-labelledby="blog-list-title">
        <div className="blog-heading"><div><p className="event-practical-label">À LIRE À TON RYTHME</p><h2 id="blog-list-title">Le journal O’BORD<span>.</span></h2></div><span>{String(posts.length).padStart(2, '0')} ARTICLES</span></div>
        {error ? <section className="blog-empty"><h3>Le journal est momentanément indisponible.</h3><p>Réessaie dans un instant.</p></section> : posts.length ? (
          <div className="blog-grid">
            {posts.map((post) => (
              <article className="blog-card" key={post.id}>
                <Link href={`/blog/${encodeURIComponent(post.slug)}`} className="blog-card-link" aria-label={`Lire l’article : ${post.title}`}>
                  {post.coverImageUrl ? <img className="blog-card-cover" src={post.coverImageUrl} alt={`Miniature de l’article ${post.title}`} loading="lazy" /> : <div className="blog-card-placeholder" aria-hidden="true"><span>O’BORD</span><b>✳</b></div>}
                  <div className="blog-card-copy"><time dateTime={post.published_at}>{formatDate(post.published_at)}</time><h3>{post.title}</h3><p>{post.excerpt}</p><span className="blog-read-link">Lire l’article</span></div>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <section className="blog-empty"><span aria-hidden="true">✳</span><h3>Le journal est encore en train de s’écrire.</h3><p>Les articles publiés par le collectif apparaîtront ici.</p></section>
        )}
        <div className="blog-back"><Link href="/">Retour à l’accueil</Link></div>
      </section>
    </main>
  )
}
