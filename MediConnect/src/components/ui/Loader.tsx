import { cn } from '@/utils'

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }

export default function Loader({ size = 'md', className }: LoaderProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('animate-spin rounded-full border-2 border-[var(--color-border-primary)] border-t-primary-500', sizes[size])} />
    </div>
  )
}
