'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase'

type Post = { id: string; slug: string; title: string; status: 'draft' | 'published'; cover_image_path: string | null; published_at: string | null }

const BUCKET = 'obord-blog-covers'
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const MIME_EXTENSIONS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

function makeSlug(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90)
}

export default function BlogPostManager({ initialPosts, setupMissing }: { initialPosts: Post[]; setupMissing: boolean }) {
  const router = useRouter()
  const [posts, setPosts] = useState(initialPosts)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [cover, setCover] = useState<File | null>(null)
  const [publishNow, setPublishNow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function chooseCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null
    event.currentTarget.value = ''
    setError('')
    if (file && (!MIME_EXTENSIONS[file.type] || file.size > MAX_IMAGE_SIZE)) {
      setCover(null)
      setError('Choisis une image JPEG, PNG ou WebP de 5 Mo maximum.')
      return
    }
    setCover(file)
  }

  async function createPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    const cleanTitle = title.trim()
    const cleanExcerpt = excerpt.trim()
    const cleanContent = content.trim()
    const cleanSlug = makeSlug(slug || title)
    if (cleanTitle.length < 4 || cleanTitle.length > 120 || !cleanSlug || cleanExcerpt.length > 280 || cleanContent.length < 20 || cleanContent.length > 30000) {
      setError('Vérifie le titre, le lien, le résumé et le texte de l’article.')
      return
    }

    setBusy(true)
    const supabase = getSupabaseBrowserClient()
    let insertedId: string | null = null
    let uploadedPath: string | null = null
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData.user) throw new Error('organizer_session_missing')

      const publishedAt = publishNow ? new Date().toISOString() : null
      const { data: post, error: insertError } = await supabase.from('blog_posts').insert({
        slug: cleanSlug,
        title: cleanTitle,
        excerpt: cleanExcerpt,
        content: cleanContent,
        status: publishNow ? 'published' : 'draft',
        published_at: publishedAt,
        created_by: authData.user.id,
      }).select('id,slug,title,status,cover_image_path,published_at').single()
      if (insertError) throw insertError
      insertedId = post.id

      if (cover) {
        const path = `${post.id}/${crypto.randomUUID()}.${MIME_EXTENSIONS[cover.type]}`
        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, cover, { contentType: cover.type, cacheControl: '3600', upsert: false })
        if (uploadError) throw uploadError
        uploadedPath = path
        const { error: imageUpdateError } = await supabase.from('blog_posts').update({ cover_image_path: path }).eq('id', post.id)
        if (imageUpdateError) throw imageUpdateError
      }

      const savedPost: Post = { ...post, cover_image_path: uploadedPath }
      setPosts((current) => [savedPost, ...current])
      setNotice(publishNow ? 'Ton article est publié sur le blog.' : 'Ton article est enregistré comme brouillon.')
      setTitle('')
      setSlug('')
      setSlugEdited(false)
      setExcerpt('')
      setContent('')
      setCover(null)
      setPublishNow(false)
      router.refresh()
    } catch (cause) {
      if (uploadedPath) await supabase.storage.from(BUCKET).remove([uploadedPath])
      if (insertedId) await supabase.from('blog_posts').delete().eq('id', insertedId)
      const message = cause instanceof Error ? cause.message : ''
      setError(message.includes('duplicate key') || message.includes('blog_posts_slug_key')
        ? 'Ce lien d’article est déjà utilisé. Choisis-en un autre.'
        : 'L’article n’a pas pu être enregistré. Vérifie que le script SQL du blog est installé et que ton compte est organisateur.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="blog-admin-manager" aria-labelledby="blog-admin-title">
      <header><p className="event-practical-label">LE JOURNAL O’BORD</p><h2 id="blog-admin-title">Préparer un article.</h2><p>Rédige un texte du collectif et ajoute une vraie photo en miniature. Rien n’est inventé ni publié sans ton choix.</p></header>
      {setupMissing ? <p className="backoffice-feedback" role="status">La base du blog n’est pas configurée. Exécute <code>supabase/obord_blog.sql</code> dans Supabase.</p> : (
        <>
          <form className="blog-admin-form" onSubmit={createPost}>
            <label>Titre<input value={title} onChange={(event) => { setTitle(event.target.value); if (!slugEdited) setSlug(makeSlug(event.target.value)) }} maxLength={120} required /></label>
            <label>Lien de l’article<input value={slug} onChange={(event) => { setSlugEdited(true); setSlug(makeSlug(event.target.value)) }} maxLength={90} placeholder="mon-article" required /><small>Utilisé dans l’adresse obord…/blog/mon-article</small></label>
            <label>Résumé court<textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} maxLength={280} rows={3} required /></label>
            <label>Texte de l’article<textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={30000} rows={10} required /></label>
            <label className="blog-admin-cover-label">Miniature (JPEG, PNG ou WebP · 5 Mo max.)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseCover} />{cover && <span>Image choisie : {cover.name}</span>}</label>
            <label className="blog-admin-publish"><input type="checkbox" checked={publishNow} onChange={(event) => setPublishNow(event.target.checked)} /> Publier dès l’enregistrement</label>
            {error && <p className="member-feedback" role="alert">{error}</p>}
            {notice && <p className="member-feedback member-feedback-success" role="status">{notice}</p>}
            <button className="button-primary" type="submit" disabled={busy}>{busy ? 'Enregistrement…' : publishNow ? 'Publier l’article' : 'Enregistrer le brouillon'}</button>
          </form>
          <div className="blog-admin-list"><h3>Articles enregistrés · {posts.length}</h3>{posts.length ? posts.map((post) => <article key={post.id}><div><strong>{post.title}</strong><span>{post.status === 'published' ? 'Publié' : 'Brouillon'}</span></div><code>{post.slug}</code></article>) : <p>Aucun article pour le moment.</p>}</div>
        </>
      )}
    </section>
  )
}
