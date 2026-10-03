import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { AccessibilityProvider } from '@/contexts/AccessibilityContext'
import { SocketProvider } from '@/contexts/SocketContext'
import { I18nProvider } from '@/config/i18n'
import { router } from '@/routes/AppRoutes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30000 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider>
          <AccessibilityProvider>
            <AuthProvider>
              <SocketProvider>
                <NotificationProvider>
                  <SidebarProvider>
                    <RouterProvider router={router} />
                    <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-primary)' } }} />
                  </SidebarProvider>
                </NotificationProvider>
              </SocketProvider>
            </AuthProvider>
          </AccessibilityProvider>
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  )
}
