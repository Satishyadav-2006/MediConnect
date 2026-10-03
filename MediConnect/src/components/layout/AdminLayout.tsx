import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import ScrollToTop from '@/routes/ScrollToTop'
import {
  FiHome, FiUsers, FiFileText, FiMessageSquare, FiBriefcase, FiCalendar,
  FiCheckSquare, FiBarChart2, FiAlertTriangle, FiMonitor, FiSettings,
  FiClipboard, FiMenu, FiX, FiArrowLeft,
} from 'react-icons/fi'
import { cn } from '@/utils'
import { ROUTES } from '@/constants/routes'

type AdminNavItem = {
  icon: typeof FiHome
  label: string
  path: string
}

type AdminNavSection = {
  heading: string
  items: AdminNavItem[]
}

const adminSections: AdminNavSection[] = [
  {
    heading: 'Overview',
    items: [
      { icon: FiHome, label: 'Dashboard', path: ROUTES.ADMIN },
      { icon: FiBarChart2, label: 'Analytics', path: ROUTES.ADMIN_ANALYTICS },
    ],
  },
  {
    heading: 'People',
    items: [
      { icon: FiUsers, label: 'Users', path: ROUTES.ADMIN_USERS },
      { icon: FiUsers, label: 'Organizations', path: ROUTES.ADMIN_ORGANIZATIONS },
      { icon: FiCheckSquare, label: 'Verification', path: ROUTES.ADMIN_VERIFICATION },
    ],
  },
  {
    heading: 'Content',
    items: [
      { icon: FiFileText, label: 'Posts', path: ROUTES.ADMIN_POSTS },
      { icon: FiMessageSquare, label: 'Comments', path: ROUTES.ADMIN_COMMENTS },
    ],
  },
  {
    heading: 'Recruitment',
    items: [
      { icon: FiBriefcase, label: 'Jobs', path: ROUTES.ADMIN_JOBS },
      { icon: FiCalendar, label: 'Internships', path: ROUTES.ADMIN_INTERNSHIPS },
      { icon: FiCalendar, label: 'Events', path: ROUTES.ADMIN_EVENTS },
    ],
  },
  {
    heading: 'Platform',
    items: [
      { icon: FiMessageSquare, label: 'Messages', path: ROUTES.ADMIN_MESSAGES },
      { icon: FiAlertTriangle, label: 'Reports', path: ROUTES.ADMIN_REPORTS },
      { icon: FiClipboard, label: 'Audit Logs', path: ROUTES.ADMIN_AUDIT_LOGS },
    ],
  },
  {
    heading: 'System',
    items: [
      { icon: FiMonitor, label: 'System', path: ROUTES.ADMIN_SYSTEM },
      { icon: FiSettings, label: 'Settings', path: ROUTES.ADMIN_SETTINGS },
    ],
  },
]

export default function AdminLayout() {
  const location = useLocation()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const closeMobile = () => setIsMobileOpen(false)

  const isActive = (path: string) =>
    path === ROUTES.ADMIN ? location.pathname === path : location.pathname === path

  const navContent = (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
      {adminSections.map(section => (
        <div key={section.heading}>
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            {section.heading}
          </p>
          <div className="space-y-1">
            {section.items.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobile}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive(item.path)
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
                )}
                aria-current={isActive(item.path) ? 'page' : undefined}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )

  const header = (
    <div className="border-b border-[var(--color-border-primary)] px-5 py-4">
      <Link
        to={ROUTES.DASHBOARD}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:text-primary-600"
      >
        <FiArrowLeft size={16} />
        Back to MediConnect
      </Link>
      <h1 className="mt-1 text-lg font-bold text-[var(--color-text-primary)]">Admin Panel</h1>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-[var(--color-bg-secondary)]">
      <ScrollToTop />

      <aside
        className="hidden w-64 shrink-0 flex-col border-r border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] lg:flex"
        aria-label="Admin sidebar"
      >
        {header}
        {navContent}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-4 py-3 lg:hidden">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
            aria-label="Open admin menu"
          >
            <FiMenu size={20} />
          </button>
          <span className="text-base font-bold text-[var(--color-text-primary)]">Admin Panel</span>
        </div>

        <main className="flex-1">
          <div className="mx-auto max-w-screen-xl px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={closeMobile} />
          <aside
            className="absolute left-0 top-0 flex h-full w-72 flex-col bg-[var(--color-bg-primary)] shadow-xl"
            aria-label="Mobile admin sidebar"
          >
            <div className="flex items-start justify-between border-b border-[var(--color-border-primary)] pr-3">
              <div className="flex-1">{header}</div>
              <button
                onClick={closeMobile}
                className="mt-4 rounded-lg p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
                aria-label="Close admin menu"
              >
                <FiX size={20} />
              </button>
            </div>
            {navContent}
          </aside>
        </div>
      )}
    </div>
  )
}
