import Skeleton from '@/components/ui/Skeleton'

export default function JobCardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-4 w-40 mb-2" />
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-3 w-32 mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  )
}
