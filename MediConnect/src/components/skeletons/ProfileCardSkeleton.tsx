import Skeleton from '@/components/ui/Skeleton'

export default function ProfileCardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]">
      <Skeleton className="h-32 w-full rounded-t-xl" />
      <div className="px-4 pb-4">
        <Skeleton className="h-20 w-20 rounded-full -mt-10 border-4 border-[var(--color-bg-primary)] mb-3" />
        <Skeleton className="h-5 w-40 mb-2" />
        <Skeleton className="h-3 w-32 mb-2" />
        <Skeleton className="h-3 w-48 mb-4" />
        <div className="flex gap-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
}
