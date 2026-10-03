import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiBell, FiCheck, FiX } from 'react-icons/fi'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Avatar, Button } from '@/components/ui'
import { connectionService } from '@/api/connectionService'
import { showSuccess, showError } from '@/components/ui/Toast'
import { useNotifications } from '@/contexts/NotificationContext'
import { cn, getRelativeTime } from '@/utils'

interface NotificationsDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationsDrawer({ isOpen, onClose }: NotificationsDrawerProps) {
  const navigate = useNavigate()
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, isLoading } = useNotifications()
  const queryClient = useQueryClient()

  const acceptConnection = useMutation({
    mutationFn: ({ userId }: { userId: string; notificationId: string }) => connectionService.acceptRequestByUserId(userId),
    onSuccess: (data, vars) => {
      showSuccess((data as { alreadyHandled?: boolean })?.alreadyHandled ? 'Already connected' : 'Connection accepted')
      deleteNotification(vars.notificationId)
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] })
      queryClient.invalidateQueries({ queryKey: ['connections'] })
    },
    onError: () => showError('Failed to accept connection'),
  })

  const declineConnection = useMutation({
    mutationFn: ({ userId }: { userId: string; notificationId: string }) => connectionService.rejectRequestByUserId(userId),
    onSuccess: (data, vars) => {
      showSuccess((data as { alreadyHandled?: boolean })?.alreadyHandled ? 'Request already processed' : 'Connection request declined')
      deleteNotification(vars.notificationId)
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] })
    },
    onError: () => showError('Failed to decline request'),
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-sm border-l border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] px-4 py-3">
              <div className="flex items-center gap-2">
                <FiBell size={20} className="text-[var(--color-text-primary)]" />
                <h2 className="font-semibold text-[var(--color-text-primary)]">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-primary-500 px-2 py-0.5 text-xs font-medium text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]" title="Mark all as read">
                    <FiCheck size={18} />
                  </button>
                )}
                <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]">
                  <FiX size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto" style={{ height: 'calc(100% - 57px)' }}>
              {isLoading ? (
                <div className="space-y-3 p-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex animate-pulse items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-[var(--color-bg-tertiary)]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-3/4 rounded bg-[var(--color-bg-tertiary)]" />
                        <div className="h-2.5 w-1/2 rounded bg-[var(--color-bg-tertiary)]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-[var(--color-text-muted)]">
                  <FiBell size={40} className="mb-3 opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div>
                  {notifications.map(n => (
                    <div
                      key={n._id}
                      onClick={() => {
                        if (!n.isRead) markAsRead(n._id)
                        if (n.type === 'connection_request') {
                          onClose()
                          navigate('/connections?tab=pending')
                        }
                      }}
                      className={cn(
                        'flex items-start gap-3 border-b border-[var(--color-border-primary)] px-4 py-3 transition-colors hover:bg-[var(--color-bg-hover)] cursor-pointer',
                        !n.isRead && 'bg-primary-50/50 dark:bg-primary-900/10'
                      )}
                    >
                      <Avatar name={n.sender?.fullName || 'System'} src={n.sender?.profilePhoto} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--color-text-primary)]">
                          <span className="font-medium">{n.sender?.fullName || 'System'}</span>{' '}
                          {n.message}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                          {getRelativeTime(n.createdAt)}
                        </p>
                        {n.type === 'connection_request' && (n.sender?._id || n.referenceId) && (
                          <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              leftIcon={<FiCheck size={14} />}
                              onClick={() => acceptConnection.mutate({ userId: n.sender?._id || n.referenceId!, notificationId: n._id })}
                              isLoading={acceptConnection.isPending}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => declineConnection.mutate({ userId: n.sender?._id || n.referenceId!, notificationId: n._id })}
                              isLoading={declineConnection.isPending}
                            >
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary-500" />}
                        <button
                          onClick={e => { e.stopPropagation(); deleteNotification(n._id) }}
                          className="rounded p-1 text-[var(--color-text-muted)] opacity-0 hover:bg-[var(--color-bg-hover)] group-hover:opacity-100"
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
