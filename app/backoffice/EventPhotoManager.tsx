'use client'

import { useRouter } from 'next/navigation'
import { useState, type ChangeEvent } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'

type ManagedEvent = {
  id: string
  title: string
  starts_at: string
  image_paths: string[]
}

const BUCKET = 'obord-event-photos'
const MAX_PHOTOS = 6
const MAX_FILE_SIZE = 5 * 1024 * 1024
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export default function EventPhotoManager({ initialEvents, setupMissing = false }: { initialEvents: ManagedEvent[]; setupMissing?: boolean }) {
  const router = useRouter()
  const [events, setEvents] = useState(initialEvents)
  const [busyEventId, setBusyEventId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  async function uploadPhotos(eventId: string, change: ChangeEvent<HTMLInputElement>) {
    const input = change.currentTarget
    const files = Array.from(input.files ?? [])
    input.value = ''
    if (!files.length) return

    const event = events.find((item) => item.id === eventId)
    if (!event) return
    if (event.image_paths.length + files.length > MAX_PHOTOS) {
      setError(`Tu peux ajouter au maximum ${MAX_PHOTOS} photos par rencontre.`)
      return
    }
    const invalidFile = files.find((file) => !EXTENSIONS[file.type] || file.size > MAX_FILE_SIZE)
    if (invalidFile) {
      setError('Choisis des images JPEG, PNG ou WebP de 5 Mo maximum chacune.')
      return
    }

    setBusyEventId(eventId)
    setError('')
    setFeedback('')
    const supabase = getSupabaseBrowserClient()
    const uploadedPaths: string[] = []

    try {
      for (const file of files) {
        const path = `${eventId}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`
        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        })
        if (uploadError) throw uploadError
        uploadedPaths.push(path)
      }

      const updatedPaths = [...event.image_paths, ...uploadedPaths]
      const { data, error: saveError } = await supabase
        .from('events')
        .update({ image_paths: updatedPaths })
        .eq('id', eventId)
        .eq('status', 'published')
        .select('id')
        .maybeSingle()
      if (saveError) throw saveError
      if (!data) throw new Error('event_not_available')

      setEvents((current) => current.map((item) => item.id === eventId ? { ...item, image_paths: updatedPaths } : item))
      setFeedback('Les photos sont ajoutées à la rencontre.')
      router.refresh()
    } catch (cause) {
      if (uploadedPaths.length) await supabase.storage.from(BUCKET).remove(uploadedPaths)
      const message = cause instanceof Error ? cause.message : ''
      setError(message.includes('Bucket not found') || message.includes('does not exist')
        ? 'Le stockage des photos n’est pas encore configuré. Applique le script SQL de galerie dans Supabase.'
        : 'Les photos n’ont pas pu être enregistrées. Vérifie le script SQL, le format et la taille, puis réessaie.')
    } finally {
      setBusyEventId(null)
    }
  }

  async function removePhoto(event: ManagedEvent, path: string) {
    setBusyEventId(event.id)
    setError('')
    setFeedback('')
    const supabase = getSupabaseBrowserClient()
    try {
      const updatedPaths = event.image_paths.filter((item) => item !== path)
      const { data, error: saveError } = await supabase
        .from('events')
        .update({ image_paths: updatedPaths })
        .eq('id', event.id)
        .eq('status', 'published')
        .select('id')
        .maybeSingle()
      if (saveError) throw saveError
      if (!data) throw new Error('event_not_available')

      setEvents((current) => current.map((item) => item.id === event.id ? { ...item, image_paths: updatedPaths } : item))
      const { error: removeError } = await supabase.storage.from(BUCKET).remove([path])
      if (removeError) {
        setError('La photo a été retirée du site, mais son fichier n’a pas pu être supprimé du stockage.')
      } else {
        setFeedback('La photo a été retirée de la rencontre.')
      }
      router.refresh()
    } catch {
      setError('La photo n’a pas pu être retirée. Vérifie les règles de stockage Supabase et réessaie.')
    } finally {
      setBusyEventId(null)
    }
  }

  return (
    <section className="backoffice-photo-manager" aria-labelledby="event-photo-manager-title">
      <header><p className="event-practical-label">PHOTOS DES RENCONTRES</p><h2 id="event-photo-manager-title">Fais découvrir l’ambiance.</h2><p>Ajoute jusqu’à six photos réelles par plan. Elles seront visibles sur la page publique de la rencontre.</p></header>
      {setupMissing ? <p className="backoffice-feedback" role="status">Le stockage des photos n’est pas configuré. Applique <code>supabase/obord_capacity_member_edits_event_photos.sql</code> dans Supabase.</p> : events.length ? <div className="backoffice-photo-events">{events.map((event) => {
        const supabase = getSupabaseBrowserClient()
        return <article className="backoffice-photo-event" key={event.id}>
          <div className="backoffice-photo-event-heading"><div><h3>{event.title}</h3><p>{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Africa/Abidjan' }).format(new Date(event.starts_at))}</p></div><span>{event.image_paths.length}/{MAX_PHOTOS} photos</span></div>
          {event.image_paths.length > 0 && <div className="backoffice-photo-grid">{event.image_paths.map((path) => {
            const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
            return <figure key={path}><img src={url} alt={`Photo de ${event.title}`} /><button type="button" onClick={() => void removePhoto(event, path)} disabled={busyEventId === event.id}>Retirer</button></figure>
          })}</div>}
          <label className="backoffice-photo-upload">{busyEventId === event.id ? 'Enregistrement des photos…' : 'Ajouter des photos'}<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busyEventId === event.id || event.image_paths.length >= MAX_PHOTOS} onChange={(change) => void uploadPhotos(event.id, change)} /></label>
          <p className="backoffice-photo-help">JPEG, PNG ou WebP · 5 Mo maximum par photo</p>
        </article>
      })}</div> : <p className="backoffice-empty-copy">Aucune rencontre publiée à venir à illustrer pour le moment.</p>}
      {error && <p className="member-feedback" role="alert">{error}</p>}
      {feedback && <p className="member-feedback member-feedback-success" role="status">{feedback}</p>}
    </section>
  )
}
