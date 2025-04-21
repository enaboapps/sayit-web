export default function PhrasesSkeleton() {
  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Board Carousel Skeleton */}
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1 bg-gray-200 rounded-xl p-4 min-h-[60px] animate-pulse" />
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
        </div>

        {/* Phrases Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="bg-gray-200 rounded-lg p-4 h-32 animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  )
} 