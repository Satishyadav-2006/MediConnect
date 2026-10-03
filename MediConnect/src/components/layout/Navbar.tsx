import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FiPlus, FiSun, FiMoon, FiBell, FiMessageSquare, FiChevronDown, FiUser, FiSettings, FiHelpCircle, FiLogOut, FiFileText, FiBriefcase, FiCalendar, FiSearch, FiX } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications'
import { Avatar, Dropdown, Logo } from '@/components/ui'
import SearchBar from '@/components/ui/SearchBar'
import { ROUTES } from '@/constants/routes'
import { ROLES } from '@/constants'
import { useClickOutside } from '@/hooks'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { isDark, setTheme } = useTheme()
  const { toggleMobile } = useSidebar()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const createMenuRef = useClickOutside(() => setShowCreateMenu(false))

  const { data: unreadData } = useUnreadCount()
  const unreadCount = unreadData?.count ?? unreadData?.data?.count ?? 0
  const messagesUnread = (user as unknown as Record<string, unknown>)?.unreadMessagesCount as number ?? 0

  const isRecruiting = user && ROLES.RECRUITING.includes(user.role as typeof ROLES.RECRUITING[number])
  const isVerified = !!user && user.isEmailVerified && user.accountStatus === 'active'

  const createItems = [
    ...(isVerified ? [
      { label: 'Create Post', icon: <FiFileText size={16} />, onClick: () => { navigate(ROUTES.FEED); setShowCreateMenu(false) } },
    ] : []),
    ...(isRecruiting ? [
      { label: 'Create Job', icon: <FiBriefcase size={16} />, onClick: () => { navigate(ROUTES.JOB_CREATE); setShowCreateMenu(false) } },
    ] : []),
    ...(isVerified ? [
      { label: 'Create Event', icon: <FiCalendar size={16} />, onClick: () => { navigate(ROUTES.EVENT_CREATE); setShowCreateMenu(false) } },
    ] : []),
    ...(isRecruiting ? [
      { label: 'Create Internship', icon: <FiBriefcase size={16} />, onClick: () => { navigate('/internships/create'); setShowCreateMenu(false) } },
    ] : []),
  ]

  const profileItems = [
    { label: 'My Profile', icon: <FiUser size={16} />, onClick: () => navigate(`/profile/${user?.username}`) },
    { label: 'Settings', icon: <FiSettings size={16} />, onClick: () => navigate(ROUTES.SETTINGS) },
    { label: 'Help', icon: <FiHelpCircle size={16} />, onClick: () => navigate(ROUTES.FAQ) },
    { label: 'Logout', icon: <FiLogOut size={16} />, onClick: () => { logout(); navigate(ROUTES.LOGIN) }, danger: true },
  ]

  const handleSearchFocus = () => {
    navigate(ROUTES.SEARCH)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (value.trim()) {
      navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(value)}`)
    }
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]/95 shadow-sm backdrop-blur-md" role="navigation" aria-label="Main navigation">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button onClick={toggleMobile} className="rounded-lg p-2 hover:bg-[var(--color-bg-hover)] lg:hidden">
            <FiSearch size={20} className="text-[var(--color-text-secondary)]" />
          </button>
          <Link to={user ? ROUTES.DASHBOARD : ROUTES.HOME} className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="text-lg font-bold text-[var(--color-text-primary)] hidden sm:block">MediConnect</span>
          </Link>
        </div>

        {user && (
          <>
            <div className="hidden md:block flex-1 max-w-xl mx-8">
              <SearchBar
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                placeholder="Search MediConnect"
              />
            </div>

            <button
              onClick={() => setShowMobileSearch(true)}
              className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] md:hidden"
            >
              <FiSearch size={20} />
            </button>
          </>
        )}

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
          >
            {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>

          {user ? (
            <>
              <div className="relative" ref={createMenuRef}>
                <button
                  onClick={() => setShowCreateMenu(p => !p)}
                  className="flex items-center gap-1 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
                  aria-expanded={showCreateMenu}
                  aria-haspopup="true"
                >
                  <FiPlus size={16} />
                  <span className="hidden sm:inline">Create</span>
                </button>
                <AnimatePresence>
                  {showCreateMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] py-1.5 shadow-xl"
                    >
                      {createItems.map(item => (
                        <button
                          key={item.label}
                          onClick={item.onClick}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                        >
                          {item.icon}
                          {item.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                to={ROUTES.NOTIFICATIONS}
                className={`relative rounded-lg p-2 hover:bg-[var(--color-bg-hover)] transition-colors ${location.pathname === ROUTES.NOTIFICATIONS ? 'text-primary-500' : 'text-[var(--color-text-secondary)]'}`}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                aria-current={location.pathname === ROUTES.NOTIFICATIONS ? 'page' : undefined}
              >
                <FiBell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              <Link
                to={ROUTES.MESSAGES}
                className={`relative rounded-lg p-2 hover:bg-[var(--color-bg-hover)] transition-colors ${location.pathname === ROUTES.MESSAGES ? 'text-primary-500' : 'text-[var(--color-text-secondary)]'}`}
                aria-label={`Messages${messagesUnread > 0 ? ` (${messagesUnread} unread)` : ''}`}
                aria-current={location.pathname === ROUTES.MESSAGES ? 'page' : undefined}
              >
                <FiMessageSquare size={20} />
                {messagesUnread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white">
                    {messagesUnread > 99 ? '99+' : messagesUnread}
                  </span>
                )}
              </Link>

              <Dropdown
                trigger={
                  <button className="flex items-center gap-1 rounded-lg p-1 hover:bg-[var(--color-bg-hover)] transition-colors">
                    <Avatar src={user.profilePhoto} name={user.fullName} size="sm" />
                    <FiChevronDown size={14} className="text-[var(--color-text-muted)] hidden sm:block" />
                  </button>
                }
                items={profileItems}
              />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to={ROUTES.LOGIN} className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]">Log in</Link>
              <Link to={ROUTES.LOGIN} className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">Join now</Link>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-4 py-3 md:hidden overflow-hidden"
          >
            <div className="relative">
              <SearchBar
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                placeholder="Search MediConnect"
                autoFocus
              />
              <button
                onClick={() => { setShowMobileSearch(false); setSearchQuery('') }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
              >
                <FiX size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
