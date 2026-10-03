import Skeleton from '@/components/ui/Skeleton'

export default function SettingsSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  )
}
