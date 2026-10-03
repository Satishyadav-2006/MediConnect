import Skeleton from '@/components/ui/Skeleton'

export default function NotificationCardSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 border-b border-[var(--color-border-primary)]">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-3 w-12 shrink-0" />
    </div>
  )
}
