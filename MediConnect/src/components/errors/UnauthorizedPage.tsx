import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg-secondary)] px-4 text-center">
      <h1 className="text-6xl font-bold text-danger-500">401</h1>
      <h2 className="mt-4 text-2xl font-semibold text-[var(--color-text-primary)]">Unauthorized</h2>
      <p className="mt-2 text-[var(--color-text-secondary)]">You need to be logged in to access this page.</p>
      <Link to={ROUTES.LOGIN} className="mt-6 rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-600">
        Log In
      </Link>
    </div>
  )
}
