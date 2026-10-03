import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg-secondary)] px-4 text-center">
      <h1 className="text-6xl font-bold text-primary-500">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-[var(--color-text-primary)]">Page Not Found</h2>
      <p className="mt-2 text-[var(--color-text-secondary)]">The page you're looking for doesn't exist.</p>
      <Link to={ROUTES.HOME} className="mt-6 rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-600">
        Go Home
      </Link>
    </div>
  )
}
