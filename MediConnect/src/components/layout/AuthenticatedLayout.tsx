import { Outlet, useLocation } from 'react-router-dom'
import ScrollToTop from '@/routes/ScrollToTop'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import OfflineBanner from '@/components/ui/OfflineBanner'
import SkipToContent from '@/components/ui/SkipToContent'
import FocusIndicator from '@/components/ui/FocusIndicator'
import RightSidebar from '@/components/dashboard/RightSidebar'

export default function AuthenticatedLayout() {
  const { pathname } = useLocation()
  const isMessagesPage = pathname.startsWith('/messages')

  return (
    <div className="flex h-screen flex-col">
      <ScrollToTop />
      <FocusIndicator />
      <SkipToContent />
      <OfflineBanner />
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main
          id="main-content"
          role="main"
          aria-label="Main content"
          className={
            isMessagesPage
              ? 'flex flex-1 flex-col overflow-hidden pb-20 lg:pb-0'
              : 'flex-1 overflow-y-auto pb-20 lg:pb-0'
          }
        >
          {isMessagesPage ? (
            <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-16">
              <Outlet />
            </div>
          ) : (
            <div className="mx-auto max-w-screen-xl px-4 py-6">
              <Outlet />
            </div>
          )}
        </main>
        {!isMessagesPage && (
          <aside
            className="hidden lg:block w-80 shrink-0 border-l border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] overflow-y-auto"
            aria-label="Right sidebar"
          >
            <div className="p-4">
              <RightSidebar />
            </div>
          </aside>
        )}
      </div>
      <MobileNav />
    </div>
  )
}
