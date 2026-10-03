import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiUserPlus, FiBriefcase, FiCalendar, FiMessageSquare, FiBell, FiX, FiHeart, FiMessageCircle, FiAtSign, FiShield, FiAward, FiCheck } from 'react-icons/fi'
import { cn, getRelativeTime } from '@/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '@/api/notificationService'
import { connectionService } from '@/api/connectionService'
import { showSuccess, showError } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import type { Notification, NotificationType } from '@/types'
import Avatar from '@/components/ui/Avatar'

interface NotificationCardProps {
  notification: Notification
}

const typeIconMap: Record<NotificationType, typeof FiBell> = {
  connection_request: FiUserPlus,
  connection_accepted: FiUserPlus,
  follower: FiUserPlus,
  job: FiBriefcase,
  internship: FiBriefcase,
  event: FiCalendar,
  message: FiMessageSquare,
  mentorship: FiAward,
  verification: FiShield,
  system: FiBell,
  admin: FiBell,
  post_like: FiHeart,
  post_comment: FiMessageCircle,
  mention: FiAtSign,
}

const typeColorMap: Record<NotificationType, string> = {
  connection_request: 'bg-blue-100 text-blue-600',
  connection_accepted: 'bg-green-100 text-green-600',
  follower: 'bg-purple-100 text-purple-600',
  job: 'bg-orange-100 text-orange-600',
  internship: 'bg-orange-100 text-orange-600',
  event: 'bg-cyan-100 text-cyan-600',
  message: 'bg-indigo-100 text-indigo-600',
  mentorship: 'bg-teal-100 text-teal-600',
  verification: 'bg-emerald-100 text-emerald-600',
  system: 'bg-gray-100 text-gray-600',
  admin: 'bg-gray-100 text-gray-600',
  post_like: 'bg-red-100 text-red-600',
  post_comment: 'bg-blue-100 text-blue-600',
  mention: 'bg-violet-100 text-violet-600',
}

const typeRouteMap: Record<NotificationType, (n: Notification) => string> = {
  connection_request: () => '/connections?tab=pending',
  connection_accepted: () => '/connections',
  follower: () => '/connections',
  job: (n) => `/jobs/${n.referenceId || ''}`,
  internship: (n) => `/internships/${n.referenceId || ''}`,
  event: (n) => `/events/${n.referenceId || ''}`,
  message: () => '/messages',
  mentorship: () => '/mentorship',
  verification: () => '/settings',
  system: () => '/notifications',
  admin: () => '/notifications',
  post_like: (n) => `/feed?post=${n.referenceId || ''}`,
  post_comment: (n) => `/feed?post=${n.referenceId || ''}`,
  mention: (n) => `/feed?post=${n.referenceId || ''}`,
}

export default function NotificationCard({ notification }: NotificationCardProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const Icon = typeIconMap[notification.type] || FiBell
  const iconColor = typeColorMap[notification.type] || 'bg-gray-100 text-gray-600'

  const readMutation = useMutation({
    mutationFn: () => notificationService.markAsRead(notification._id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => notificationService.deleteNotification(notification._id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const requesterId = notification.sender?._id || notification.referenceId

  const acceptConnection = useMutation({
    mutationFn: (userId: string) => connectionService.acceptRequestByUserId(userId),
    onSuccess: (data) => {
      showSuccess((data as { alreadyHandled?: boolean })?.alreadyHandled ? 'Already connected' : 'Connection accepted')
      deleteMutation.mutate()
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] })
      queryClient.invalidateQueries({ queryKey: ['connections'] })
    },
    onError: () => showError('Failed to accept connection'),
  })

  const declineConnection = useMutation({
    mutationFn: (userId: string) => connectionService.rejectRequestByUserId(userId),
    onSuccess: (data) => {
      showSuccess((data as { alreadyHandled?: boolean })?.alreadyHandled ? 'Request already processed' : 'Connection request declined')
      deleteMutation.mutate()
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] })
    },
    onError: () => showError('Failed to decline request'),
  })

  const handleClick = () => {
    if (!notification.isRead) readMutation.mutate()
    const route = typeRouteMap[notification.type](notification)
    navigate(route)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
      onClick={handleClick}
      className={cn(
        'relative flex items-start gap-3 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4 cursor-pointer transition-colors hover:bg-[var(--color-bg-hover)] group',
        !notification.isRead && 'bg-primary-50/30'
      )}
    >
      {!notification.isRead && (
        <span className="absolute top-4 left-2 h-2 w-2 rounded-full bg-primary-500" />
      )}

      <div className="relative shrink-0">
        {notification.sender ? (
          <Avatar
            src={notification.sender.profilePhoto}
            name={notification.sender.fullName}
            size="md"
          />
        ) : (
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', iconColor)}>
            <Icon size={18} />
          </div>
        )}
        {notification.sender && (
          <div className={cn('absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--color-bg-primary)]', iconColor)}>
            <Icon size={10} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn('text-sm leading-relaxed', notification.isRead ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-primary)]')}>
          {notification.sender && (
            <span className="font-semibold">{notification.sender.fullName} </span>
          )}
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          {getRelativeTime(notification.createdAt)}
        </p>
        {notification.type === 'connection_request' && requesterId && (
          <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              leftIcon={<FiCheck size={14} />}
              onClick={() => acceptConnection.mutate(requesterId)}
              isLoading={acceptConnection.isPending}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => declineConnection.mutate(requesterId)}
              isLoading={declineConnection.isPending}
            >
              Decline
            </Button>
          </div>
        )}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate() }}
        className="shrink-0 rounded-lg p-1.5 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 hover:bg-[var(--color-bg-tertiary)] transition-all"
      >
        <FiX size={14} />
      </button>
    </motion.div>
  )
}
