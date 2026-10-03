import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiHome, FiUser, FiBriefcase, FiCalendar, FiMessageSquare, FiBell, FiSettings, FiCompass, FiBookmark, FiShield, FiAward, FiBarChart2, FiLink2, FiBookOpen, FiLogOut, FiInbox, FiUsers } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { Logo } from '@/components/ui'
import { cn } from '@/utils'
import { ROUTES } from '@/constants/routes'
import { ROLES } from '@/constants'

type NavItem = {
  icon: typeof FiHome
  label: string
  path: string
  isProfile?: boolean
  minRole?: 'verified' | 'admin'
  roles?: readonly string[]
}

const navItems: NavItem[] = [
  { icon: FiHome, label: 'Dashboard', path: ROUTES.DASHBOARD },
  { icon: FiCompass, label: 'Feed', path: ROUTES.FEED },
  { icon: FiLink2, label: 'Connections', path: ROUTES.CONNECTIONS },
  { icon: FiUser, label: 'Profile', path: '/profile/', isProfile: true },
  { icon: FiBriefcase, label: 'Jobs', path: ROUTES.JOBS },
  { icon: FiBookOpen, label: 'Internships', path: ROUTES.INTERNSHIPS },
  { icon: FiCalendar, label: 'Events', path: ROUTES.EVENTS },
  { icon: FiAward, label: 'Mentorship', path: ROUTES.MENTORS, minRole: 'verified' },
  { icon: FiMessageSquare, label: 'Messages', path: ROUTES.MESSAGES },
  { icon: FiBell, label: 'Notifications', path: ROUTES.NOTIFICATIONS },
  { icon: FiBarChart2, label: 'Analytics', path: ROUTES.ANALYTICS, minRole: 'verified' },
  { icon: FiBookmark, label: 'Bookmarks', path: ROUTES.BOOKMARKS },
  { icon: FiBookmark, label: 'Saved Jobs', path: ROUTES.JOBS_SAVED },
  { icon: FiInbox, label: 'My Applications', path: ROUTES.JOBS_APPLIED },
  { icon: FiUsers, label: 'Job Applicants', path: ROUTES.JOBS_APPLICANTS, roles: ROLES.RECRUITING },
  { icon: FiUsers, label: 'Internship Applicants', path: ROUTES.INTERNSHIPS_APPLICANTS, roles: ROLES.RECRUITING },
  { icon: FiUsers, label: 'Event Registrants', path: ROUTES.EVENTS_REGISTRANTS, roles: ROLES.RECRUITING },
  { icon: FiSettings, label: 'Settings', path: ROUTES.SETTINGS },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { isMobileOpen, closeMobile } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()
  const isAdmin = user && ROLES.ADMIN.includes(user.role as typeof ROLES.ADMIN[number])
  const isVerified = !!user && user.isEmailVerified && user.accountStatus === 'active'

  const canViewItem = (item: NavItem) => {
    if (item.roles) return !!user && item.roles.includes(user.role)
    if (!item.minRole) return true
    if (!user) return false
    if (item.minRole === 'admin') return isAdmin
    if (item.minRole === 'verified') return isVerified
    return true
  }

  const isActive = (path: string, isProfile?: boolean) => {
    if (isProfile) return location.pathname.startsWith('/profile')
    return location.pathname === path
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="space-y-1">
          {navItems.filter(canViewItem).map(item => {
            const path = item.isProfile ? `/profile/${user?.username}` : item.path
            return (
              <Link
                key={item.path}
                to={path}
                onClick={closeMobile}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive(item.path, item.isProfile)
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
                )}
                aria-current={isActive(item.path, item.isProfile) ? 'page' : undefined}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
          {isAdmin && (
            <>
              <div className="my-3 border-t border-[var(--color-border-primary)]" />
              <Link
                to={ROUTES.ADMIN}
                onClick={closeMobile}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  location.pathname.startsWith('/admin')
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
                )}
                aria-current={location.pathname.startsWith('/admin') ? 'page' : undefined}
              >
                <FiShield size={20} />
                <span>Admin Panel</span>
              </Link>
            </>
          )}
          <div className="my-3 border-t border-[var(--color-border-primary)]" />
          <button
            onClick={() => { logout(); closeMobile(); navigate(ROUTES.LOGIN) }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <FiLogOut size={20} />
            <span>Logout</span>
          </button>
        </nav>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:block w-60 shrink-0 border-r border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]" role="navigation" aria-label="Sidebar navigation">
        <div className="flex items-center gap-2 px-4 py-4">
          <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="text-lg font-bold text-[var(--color-text-primary)]">MediConnect</span>
          </Link>
        </div>
        {sidebarContent}
      </aside>
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={closeMobile} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-[var(--color-bg-primary)] shadow-xl" role="navigation" aria-label="Mobile sidebar navigation">
            <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] px-4 py-4">
              <Logo size="sm" withText textClassName="text-lg" />
              <button onClick={closeMobile} className="rounded-lg p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]" aria-label="Close menu">X</button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
