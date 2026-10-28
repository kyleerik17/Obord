import { createClient } from '@/lib/supabase/server'

export type BlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  cover_image_path: string | null
  published_at: string
  created_at: string
}

const BLOG_BUCKET = 'obord-blog-covers'

function withCoverUrl(supabase: Awaited<ReturnType<typeof createClient>>, post: BlogPost) {
  return {
    ...post,
    coverImageUrl: post.cover_image_path
      ? supabase.storage.from(BLOG_BUCKET).getPublicUrl(post.cover_image_path).data.publicUrl
      : null,
  }
}

export async function getPublishedBlogPosts() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id,slug,title,excerpt,content,cover_image_path,published_at,created_at')
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })

    if (error) {
      console.warn('[blog] Unable to load published posts', { code: error.code })
      return { posts: [], error: true }
    }

    return { posts: (data ?? []).map((post) => withCoverUrl(supabase, post as BlogPost)), error: false }
  } catch {
    return { posts: [], error: true }
  }
}

export async function getPublishedBlogPost(slug: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id,slug,title,excerpt,content,cover_image_path,published_at,created_at')
      .eq('slug', slug)
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .maybeSingle()

    if (error || !data) return null
    return withCoverUrl(supabase, data as BlogPost)
  } catch {
    return null
  }
}
