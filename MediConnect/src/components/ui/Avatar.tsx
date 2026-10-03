import { cn, getInitials } from '@/utils'

interface AvatarProps {
  src?: string
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  isOnline?: boolean
  isVerified?: boolean
  className?: string
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

export default function Avatar({ src, alt, name, size = 'md', isOnline, isVerified, className }: AvatarProps) {
  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 overflow-hidden rounded-full',
        sizeClasses[size],
        className
      )}
      role="img"
      aria-label={name || 'User'}
    >
      {src ? (
        <img
          src={src}
          alt={alt || name || 'User'}
          className="block h-full w-full rounded-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-primary-500 font-medium text-white">
          {getInitials(name)}
        </div>
      )}
      {isOnline && (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-bg-primary)] bg-accent-500" />
      )}
      {isVerified && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-white">
          <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
        </span>
      )}
    </div>
  )
}
