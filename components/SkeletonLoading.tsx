type SkeletonType = 'card' | 'text' | 'hero' | 'grid' | 'list' | 'page'

export default function SkeletonLoading({ type = 'card' }: { type?: SkeletonType }) {
  if (type === 'hero') {
    return (
      <div className="h-screen flex items-center justify-center bg-background" aria-label="Chargement">
        <div className="text-center">
          <div className="skeleton h-20 w-64 mx-auto mb-4 rounded-lg"></div>
          <div className="skeleton h-8 w-96 mx-auto mb-4 rounded-lg"></div>
          <div className="skeleton h-6 w-80 mx-auto rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (type === 'text') {
    return <div className="skeleton h-6 w-full rounded"></div>
  }

  if (type === 'grid') {
    return (
      <div className="min-h-screen py-12 px-4 bg-gray-50" aria-label="Chargement">
        <div className="max-w-6xl mx-auto">
          <div className="skeleton h-12 w-72 mx-auto mb-4 rounded-lg"></div>
          <div className="skeleton h-6 w-96 max-w-full mx-auto mb-12 rounded-lg"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonLoading key={index} type="card" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (type === 'list') {
    return (
      <div className="min-h-screen py-12 px-4 bg-gray-50" aria-label="Chargement">
        <div className="max-w-6xl mx-auto">
          <div className="skeleton h-12 w-72 mx-auto mb-4 rounded-lg"></div>
          <div className="skeleton h-6 w-96 max-w-full mx-auto mb-12 rounded-lg"></div>
          <div className="space-y-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="soft-card overflow-hidden rounded-xl">
                <div className="skeleton h-28 w-full"></div>
                <div className="p-6 space-y-4">
                  <div className="skeleton h-5 w-full rounded"></div>
                  <div className="skeleton h-5 w-3/4 rounded"></div>
                  <div className="skeleton h-24 w-full rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (type === 'page') {
    return (
      <div className="min-h-screen py-12 px-4 bg-gray-50" aria-label="Chargement">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="skeleton h-12 w-80 max-w-full mx-auto rounded-lg"></div>
          <div className="skeleton h-6 w-[36rem] max-w-full mx-auto rounded-lg"></div>
          <div className="skeleton h-72 w-full rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="soft-card overflow-hidden rounded-xl" aria-label="Chargement">
      <div className="skeleton h-48 w-full"></div>
      <div className="p-6">
        <div className="skeleton h-6 w-3/4 mb-4 rounded"></div>
        <div className="skeleton h-4 w-full mb-2 rounded"></div>
        <div className="skeleton h-4 w-2/3 rounded"></div>
      </div>
    </div>
  )
}
