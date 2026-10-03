import Skeleton from '@/components/ui/Skeleton'

export default function SearchResultsSkeleton() {
  return (
    <div className="flex gap-6">
      <div className="w-64 space-y-4">
        <Skeleton className="h-10 w-full rounded-lg" />
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="flex-1 space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
