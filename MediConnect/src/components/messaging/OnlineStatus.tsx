import { useSocket } from '@/contexts/SocketContext'
import { cn } from '@/utils'

interface OnlineStatusProps {
  userId: string
  className?: string
  showText?: boolean
}

export default function OnlineStatus({ userId, className, showText }: OnlineStatusProps) {
  const { onlineUsers } = useSocket()
  const isOnline = onlineUsers.has(userId)

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={cn(
        'h-2 w-2 rounded-full',
        isOnline ? 'bg-accent-500' : 'bg-[var(--color-text-muted)]'
      )} />
      {showText && (
        <span className={cn('text-xs', isOnline ? 'text-accent-600' : 'text-[var(--color-text-muted)]')}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </span>
  )
}
