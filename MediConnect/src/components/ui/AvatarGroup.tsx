import { cn, getInitials } from '@/utils'
import Tooltip from './Tooltip'

interface AvatarItem {
  src?: string
  name: string
}

interface AvatarGroupProps {
  avatars: AvatarItem[]
  max?: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

const overlapSize = {
  xs: '-ml-1.5',
  sm: '-ml-2',
  md: '-ml-2.5',
  lg: '-ml-3',
}

export default function AvatarGroup({ avatars, max = 3, size = 'md', className }: AvatarGroupProps) {
  const visible = avatars.slice(0, max)
  const overflow = avatars.length - max

  return (
    <div className={cn('flex items-center', className)} role="group" aria-label={`Group of ${avatars.length} avatars`}>
      {visible.map((avatar, i) => (
        <Tooltip key={i} content={avatar.name}>
          <div className={cn(i > 0 && overlapSize[size], 'relative overflow-hidden rounded-full ring-2 ring-[var(--color-bg-primary)]', sizeClasses[size])}>
            {avatar.src ? (
              <img
                src={avatar.src}
                alt={avatar.name}
                className="block h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-primary-500 font-medium text-white">
                {getInitials(avatar.name)}
              </div>
            )}
          </div>
        </Tooltip>
      ))}
      {overflow > 0 && (
        <Tooltip content={`${overflow} more`}>
          <div className={cn(
            overlapSize[size],
            'relative flex items-center justify-center rounded-full bg-[var(--color-bg-tertiary)] ring-2 ring-[var(--color-bg-primary)] font-medium text-[var(--color-text-secondary)]',
            sizeClasses[size]
          )}>
            +{overflow}
          </div>
        </Tooltip>
      )}
    </div>
  )
}
