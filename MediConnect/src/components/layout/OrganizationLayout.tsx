import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiLayout, FiBriefcase, FiUsers, FiFileText, FiBookmark, FiBookOpen, FiCalendar,
  FiMessageSquare, FiBell, FiBarChart2, FiSettings, FiSun, FiMoon, FiX,
  FiChevronDown, FiUser, FiHelpCircle, FiLogOut, FiPlus,
} from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications'
import { Avatar, Dropdown, Logo } from '@/components/ui'
import SearchBar from '@/components/ui/SearchBar'
import OfflineBanner from '@/components/ui/OfflineBanner'
import SkipToContent from '@/components/ui/SkipToContent'
import EmptyState from '@/components/ui/EmptyState'
import ScrollToTop from '@/routes/ScrollToTop'
import { ROUTES } from '@/constants/routes'
import { CurrentOrganizationProvider, useCurrentOrganizationContext } from '@/features/organization/context/CurrentOrganizationContext'
import { cn } from '@/utils'

const NAV_ITEMS = [
  { label: 'Dashboard', to: ROUTES.ORG_DASHBOARD, icon: FiLayout },
  { label: 'Organization Profile', to: ROUTES.ORG_PROFILE, icon: FiBriefcase },
  { label: 'Employees', to: ROUTES.ORG_EMPLOYEES, icon: FiUsers },
  { label: 'Posts', to: ROUTES.ORG_POSTS, icon: FiFileText },
  { label: 'Jobs', to: ROUTES.ORG_JOBS, icon: FiBookmark },
  { label: 'Internships', to: ROUTES.ORG_INTERNSHIPS, icon: FiBookOpen },
  { label: 'Events', to: ROUTES.ORG_EVENTS, icon: FiCalendar },
  { label: 'Messages', to: ROUTES.ORG_MESSAGES, icon: FiMessageSquare },
  { label: 'Notifications', to: ROUTES.ORG_NOTIFICATIONS, icon: FiBell },
  { label: 'Analytics', to: ROUTES.ORG_ANALYTICS, icon: FiBarChart2 },
  { label: 'Settings', to: ROUTES.ORG_SETTINGS, icon: FiSettings },
]

function OrgNavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Organization workspace">
      {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) => cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            isActive
              ? 'bg-primary-500/10 text-primary-500'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
          )}
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

function OrgHeader() {
  const { user, logout } = useAuth()
  const { isDark, setTheme } = useTheme()
  const { organization } = useCurrentOrganizationContext()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: unreadData } = useUnreadCount()
  const unreadCount = unreadData?.count ?? unreadData?.data?.count ?? 0
  const messagesUnread = (user as unknown as Record<string, unknown>)?.unreadMessagesCount as number ?? 0

  const profileItems = [
    { label: 'Organization Profile', icon: <FiUser size={16} />, onClick: () => navigate(ROUTES.ORG_PROFILE) },
    { label: 'Settings', icon: <FiSettings size={16} />, onClick: () => navigate(ROUTES.ORG_SETTINGS) },
    { label: 'Help', icon: <FiHelpCircle size={16} />, onClick: () => navigate(ROUTES.FAQ) },
    { label: 'Logout', icon: <FiLogOut size={16} />, onClick: () => { logout(); navigate(ROUTES.LOGIN) }, danger: true },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4 px-4">
        <Link to={ROUTES.ORG_DASHBOARD} className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="hidden text-lg font-bold text-[var(--color-text-primary)] sm:block">Org Workspace</span>
        </Link>

        <div className="hidden flex-1 max-w-xl md:block">
          <SearchBar
            value={searchQuery}
            onChange={(v) => {
              setSearchQuery(v)
              if (v.trim()) navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(v)}`)
            }}
            onFocus={() => navigate(ROUTES.SEARCH)}
            placeholder="Search MediConnect"
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
            aria-label="Toggle theme"
          >
            {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>

          <Link
            to={ROUTES.ORG_NOTIFICATIONS}
            className={cn(
              'relative rounded-lg p-2 hover:bg-[var(--color-bg-hover)] transition-colors',
              location.pathname === ROUTES.ORG_NOTIFICATIONS ? 'text-primary-500' : 'text-[var(--color-text-secondary)]'
            )}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <FiBell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          <Link
            to={ROUTES.ORG_MESSAGES}
            className={cn(
              'relative rounded-lg p-2 hover:bg-[var(--color-bg-hover)] transition-colors',
              location.pathname === ROUTES.ORG_MESSAGES ? 'text-primary-500' : 'text-[var(--color-text-secondary)]'
            )}
            aria-label={`Messages${messagesUnread > 0 ? ` (${messagesUnread} unread)` : ''}`}
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
              <button className="flex items-center gap-1.5 rounded-lg p-1 hover:bg-[var(--color-bg-hover)] transition-colors" aria-label="Account menu">
                <Avatar src={organization?.logo} name={organization?.name || user?.fullName} size="sm" />
                <span className="hidden max-w-[10rem] truncate text-sm font-medium text-[var(--color-text-primary)] lg:block">
                  {organization?.name || user?.fullName}
                </span>
                <FiChevronDown size={14} className="hidden text-[var(--color-text-muted)] sm:block" />
              </button>
            }
            items={profileItems}
          />
        </div>
      </div>
    </header>
  )
}

function OrgWorkspace() {
  const { organization, isLoading, isError } = useCurrentOrganizationContext()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  if (isError || !organization) {
    return (
      <div className="flex min-h-screen flex-col">
        <OrgHeader />
        <div className="flex flex-1 items-center justify-center p-6">
          <EmptyState
            variant="full-page"
            icon={<FiBriefcase size={32} />}
            title="No organization linked to this account"
            description="Your organization workspace is ready, but we couldn't find an organization owned by this account. Create your organization to start managing it here."
            action={{ label: 'Create organization', onClick: () => navigate(ROUTES.ORG_CREATE) }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <ScrollToTop />
      <SkipToContent />
      <OfflineBanner />
      <OrgHeader />
      <div className="flex flex-1 overflow-hidden">
        <aside
          className="hidden w-64 shrink-0 border-r border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] overflow-y-auto lg:block"
          aria-label="Organization navigation"
        >
          <div className="border-b border-[var(--color-border-primary)] px-4 py-4">
            <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{organization.name}</p>
            <p className="text-xs text-[var(--color-text-muted)] capitalize">{organization.type?.replace(/_/g, ' ')}</p>
          </div>
          <OrgNavList />
        </aside>

        <main
          id="main-content"
          role="main"
          aria-label="Main content"
          className="flex-1 overflow-y-auto pb-20 lg:pb-0"
        >
          <div className="mx-auto max-w-screen-xl px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] lg:hidden" aria-label="Bottom navigation">
        <div className="grid grid-cols-5">
          {NAV_ITEMS.slice(0, 4).map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium',
                isActive ? 'text-primary-500' : 'text-[var(--color-text-secondary)]'
              )}
            >
              <Icon size={18} />
              {label.split(' ')[0]}
            </NavLink>
          ))}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-[var(--color-text-secondary)]"
            aria-label="Open menu"
          >
            <FiPlus size={18} />
            More
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="absolute left-0 top-0 h-full w-72 bg-[var(--color-bg-primary)] shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] px-4 py-4">
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">{organization.name}</span>
                <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]" aria-label="Close menu">
                  <FiX size={18} />
                </button>
              </div>
              <div className="h-[calc(100%-3.5rem)] overflow-y-auto">
                <OrgNavList onNavigate={() => setMobileOpen(false)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function OrganizationLayout() {
  return (
    <CurrentOrganizationProvider>
      <OrgWorkspace />
    </CurrentOrganizationProvider>
  )
}