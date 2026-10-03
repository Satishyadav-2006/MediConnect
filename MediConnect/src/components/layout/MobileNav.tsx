import { Link, useLocation } from 'react-router-dom'
import { FiHome, FiSearch, FiPlus, FiMessageSquare, FiBell } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications'
import { cn } from '@/utils'
import { ROUTES } from '@/constants/routes'
import { ROLES } from '@/constants'
import { useState } from 'react'

export default function MobileNav() {
  const { user } = useAuth()
  const location = useLocation()
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const { data: unreadData } = useUnreadCount()
  const unreadCount = unreadData?.count ?? unreadData?.data?.count ?? 0
  const messagesUnread = (user as unknown as Record<string, unknown>)?.unreadMessagesCount as number ?? 0

  const isRecruiting = user && ROLES.RECRUITING.includes(user.role as typeof ROLES.RECRUITING[number])

  const items = [
    { icon: FiHome, label: 'Home', path: ROUTES.DASHBOARD },
    { icon: FiSearch, label: 'Search', path: ROUTES.SEARCH },
    { icon: FiPlus, label: 'Create', path: '__create__', isCreate: true },
    { icon: FiMessageSquare, label: 'Messages', path: ROUTES.MESSAGES, badge: messagesUnread },
    { icon: FiBell, label: 'Notifications', path: ROUTES.NOTIFICATIONS, badge: unreadCount },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      {showCreateMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setShowCreateMenu(false)}
        />
      )}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around">
          {items.map(item => {
            const active = item.isCreate ? false : isActive(item.path)

            if (item.isCreate) {
              return (
                <div key="create" className="relative">
                  <button
                    onClick={() => setShowCreateMenu(p => !p)}
                    className="flex flex-col items-center gap-0.5 px-4 py-2 text-[10px] font-medium text-[var(--color-text-muted)] active:scale-95 transition-transform"
                    style={{ minWidth: 48, minHeight: 48, justifyContent: 'center' }}
                    aria-label="Create new content"
                    aria-expanded={showCreateMenu}
                  >
                    <motion.div whileTap={{ scale: 0.85 }}>
                      <FiPlus size={22} className="text-primary-500" />
                    </motion.div>
                    <span>Create</span>
                  </button>
                  {showCreateMenu && (
                    <div className="absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] py-1.5 shadow-xl">
                      {[
                        { label: 'Create Post', path: ROUTES.FEED },
                        ...(isRecruiting ? [{ label: 'Create Job', path: ROUTES.JOB_CREATE }] : []),
                        { label: 'Create Event', path: ROUTES.EVENT_CREATE },
                      ].map(opt => (
                        <Link
                          key={opt.label}
                          to={opt.path}
                          onClick={() => setShowCreateMenu(false)}
                          className="block px-4 py-2.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
                        >
                          {opt.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 px-4 py-2 text-[10px] font-medium transition-colors active:scale-95',
                  active ? 'text-primary-500' : 'text-[var(--color-text-muted)]'
                )}
                style={{ minWidth: 48, minHeight: 48, justifyContent: 'center' }}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                <motion.div whileTap={{ scale: 0.85 }} className="relative">
                  <item.icon size={22} />
                  {item.badge != null && item.badge > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger-500 px-1 text-[9px] font-bold text-white">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </motion.div>
                <span>{item.label}</span>
                {active && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -bottom-2 h-0.5 w-5 rounded-full bg-primary-500"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
