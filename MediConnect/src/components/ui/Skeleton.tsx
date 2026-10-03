import { cn } from '@/utils'

interface SkeletonProps { className?: string }

export default function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden="true" role="presentation" className={cn('animate-pulse rounded-md bg-[var(--color-bg-tertiary)]', className)} />
}
