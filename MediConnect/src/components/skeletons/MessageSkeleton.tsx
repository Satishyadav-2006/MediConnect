import Skeleton from '@/components/ui/Skeleton'

export default function MessageSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
          <div className={`flex items-end gap-2 max-w-xs ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
            {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
            <Skeleton className={`h-10 rounded-2xl ${i % 2 === 0 ? 'w-40' : 'w-32'}`} />
          </div>
        </div>
      ))}
    </div>
  )
}
