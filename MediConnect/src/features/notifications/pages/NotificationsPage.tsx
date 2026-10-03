import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiCheck } from 'react-icons/fi'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/features/notifications/hooks/useNotifications'
import { notificationService } from '@/api/notificationService'
import { connectionService } from '@/api/connectionService'
import { showSuccess, showError } from '@/components/ui/Toast'
import { NOTIFICATION_CATEGORIES } from '@/constants'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import { Tabs, TabList, TabTrigger, TabContent } from '@/components/ui/Tabs'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { NotificationCardSkeleton } from '@/components/skeletons'
import { NoNotificationsEmpty } from '@/components/empty-states'
import { formatDate, cn } from '@/utils'
import { extractList } from '@/lib/pagination'
import type { Notification } from '@/types'

const notificationTypeIcons: Record<string, string> = {
  connection_request: '🤝',
  connection_accepted: '✅',
  post_like: '❤️',
  post_comment: '💬',
  job: '💼',
  event: '📅',
  message: '✉️',
  mentorship: '🎓',
  system: '🔔',
  admin: '⚙️',
  mention: '@',
  follower: '👤',
  internship: '📋',
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [category, setCategory] = useState('all')
  const { data, isLoading, isError } = useNotifications(category === 'all' ? undefined : category)
  const { data: unreadData } = useUnreadCount()
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()
  const queryClient = useQueryClient()

  const acceptConnection = useMutation({
    mutationFn: ({ userId }: { userId: string; notificationId: string }) => connectionService.acceptRequestByUserId(userId),
    onSuccess: (data, vars) => {
      showSuccess((data as { alreadyHandled?: boolean })?.alreadyHandled ? 'Already connected' : 'Connection accepted')
      notificationService.deleteNotification(vars.notificationId)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] })
      queryClient.invalidateQueries({ queryKey: ['connections'] })
    },
    onError: () => showError('Failed to accept connection'),
  })

  const declineConnection = useMutation({
    mutationFn: ({ userId }: { userId: string; notificationId: string }) => connectionService.rejectRequestByUserId(userId),
    onSuccess: (data, vars) => {
      showSuccess((data as { alreadyHandled?: boolean })?.alreadyHandled ? 'Request already processed' : 'Connection request declined')
      notificationService.deleteNotification(vars.notificationId)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] })
    },
    onError: () => showError('Failed to decline request'),
  })

  const notifications = data?.pages?.flatMap(p => extractList<Notification>(p)) ?? []
  const unreadCount = unreadData?.count || unreadData?.data?.count || 0

  if (isError) {
    return (
      <motion.div {...pageTransition} className="flex flex-col items-center justify-center py-20">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Something went wrong</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Failed to load notifications.</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Notifications</h1>
          {unreadCount > 0 && <Badge variant="danger" size="sm">{unreadCount}</Badge>}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<FiCheck size={14} />}
            onClick={() => markAllAsRead.mutate()}
            isLoading={markAllAsRead.isPending}
          >
            Mark all read
          </Button>
        )}
      </div>

      <Tabs defaultValue="all">
        <TabList>
          <TabTrigger value="all" onClick={() => setCategory('all')}>All</TabTrigger>
          {NOTIFICATION_CATEGORIES.filter(c => c.value !== 'all').map(cat => (
            <TabTrigger key={cat.value} value={cat.value} onClick={() => setCategory(cat.value)}>
              {cat.label}
            </TabTrigger>
          ))}
        </TabList>

        <TabContent value={category}>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map(i => <NotificationCardSkeleton key={i} />)}
            </div>
          ) : notifications.length === 0 ? (
            <NoNotificationsEmpty />
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-2">
              {notifications.map(notif => (
                <motion.div
                  key={notif._id}
                  variants={staggerItem}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4 transition-colors hover:bg-[var(--color-bg-hover)]',
                    !notif.isRead && 'border-l-2 border-l-primary-500 bg-primary-50/30'
                  )}
                  onClick={() => {
                    if (!notif.isRead) markAsRead.mutate(notif._id)
                    if (notif.type === 'connection_request') navigate('/connections?tab=pending')
                  }}
                >
                  <div className="relative">
                    {notif.sender ? (
                      <Avatar src={notif.sender.profilePhoto} name={notif.sender.fullName} size="sm" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg-tertiary)] text-base">
                        {notificationTypeIcons[notif.type] || '🔔'}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 text-xs">{notificationTypeIcons[notif.type] || '🔔'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-text-primary)]">
                      <span className="font-semibold">{notif.title}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-text-secondary)] line-clamp-2">
                      {notif.sender && <span className="font-medium">{notif.sender.fullName} </span>}
                      {notif.message}
                    </p>
                    <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">{formatDate(notif.createdAt)}</p>
                    {notif.type === 'connection_request' && (notif.sender?._id || notif.referenceId) && (
                      <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          leftIcon={<FiCheck size={14} />}
                          onClick={() => { acceptConnection.mutate({ userId: notif.sender?._id || notif.referenceId!, notificationId: notif._id }); markAsRead.mutate(notif._id) }}
                          isLoading={acceptConnection.isPending}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { declineConnection.mutate({ userId: notif.sender?._id || notif.referenceId!, notificationId: notif._id }); markAsRead.mutate(notif._id) }}
                          isLoading={declineConnection.isPending}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!notif.isRead && <span className="h-2 w-2 rounded-full bg-primary-500" />}
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); markAsRead.mutate(notif._id) }}>
                      <FiCheck size={14} />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabContent>
      </Tabs>
    </motion.div>
  )
}
