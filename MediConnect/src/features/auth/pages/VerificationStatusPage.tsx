import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiClock, FiCheckCircle, FiXCircle, FiRefreshCw } from 'react-icons/fi'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/contexts/AuthContext'
import { pageTransition } from '@/animations'
import { getAuthenticatedHomePath } from '@/utils'
import Button from '@/components/ui/Button'

export default function VerificationStatusPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const status = user?.accountStatus

  useEffect(() => {
    if (status === 'active') {
      navigate(getAuthenticatedHomePath(user?.role), { replace: true })
    }
  }, [status, navigate, user?.role])

  if (!user) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-secondary)] px-4">
      <motion.div className="w-full max-w-md text-center" {...pageTransition}>
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-8 shadow-sm">
          {status === 'pending_professional_verification' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-warning-50"
              >
                <FiClock size={40} className="text-warning-500" />
              </motion.div>
              <h1 className="mt-6 text-2xl font-bold text-[var(--color-text-primary)]">Verification In Progress</h1>
              <p className="mt-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Your professional credentials are currently being reviewed by our verification team.
                This process typically takes 1-3 business days.
              </p>
              <div className="mt-6 rounded-lg bg-[var(--color-bg-secondary)] p-4">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">What happens next?</p>
                <ul className="mt-2 space-y-2 text-sm text-[var(--color-text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                    Our team reviews your license and credentials
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                    You will receive an email notification once verified
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                    After approval, you can access all platform features
                  </li>
                </ul>
              </div>
              <div className="mt-6 flex flex-col gap-3">
                <a href="mailto:support@mediconnect.com">
                  <Button variant="outline" fullWidth>Contact Support</Button>
                </a>
                <Button variant="ghost" fullWidth onClick={logout}>Log Out</Button>
              </div>
            </>
          )}

          {status === 'rejected' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-danger-50"
              >
                <FiXCircle size={40} className="text-danger-500" />
              </motion.div>
              <h1 className="mt-6 text-2xl font-bold text-[var(--color-text-primary)]">Verification Rejected</h1>
              <p className="mt-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Your verification request was not approved. Please review the feedback provided in your email and consider reapplying with updated documentation.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Button
                  fullWidth
                  leftIcon={<FiRefreshCw size={16} />}
                  onClick={() => navigate(ROUTES.REGISTER)}
                >
                  Reapply
                </Button>
                <a href="mailto:support@mediconnect.com">
                  <Button variant="outline" fullWidth>Contact Support</Button>
                </a>
                <Button variant="ghost" fullWidth onClick={logout}>Log Out</Button>
              </div>
            </>
          )}

          {status === 'suspended' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-warning-50"
              >
                <FiXCircle size={40} className="text-warning-500" />
              </motion.div>
              <h1 className="mt-6 text-2xl font-bold text-[var(--color-text-primary)]">Account Suspended</h1>
              <p className="mt-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Your account has been suspended. Please contact support for more information.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <a href="mailto:support@mediconnect.com">
                  <Button variant="outline" fullWidth>Contact Support</Button>
                </a>
                <Button variant="ghost" fullWidth onClick={logout}>Log Out</Button>
              </div>
            </>
          )}

          {!['pending_professional_verification', 'rejected', 'suspended'].includes(status as string) && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent-50"
              >
                <FiCheckCircle size={40} className="text-accent-500" />
              </motion.div>
              <h1 className="mt-6 text-2xl font-bold text-[var(--color-text-primary)]">All Set</h1>
              <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                Your account status is: <span className="font-medium text-[var(--color-text-primary)]">{status?.replace(/_/g, ' ')}</span>
              </p>
              <div className="mt-6">
                <Button fullWidth onClick={() => navigate(getAuthenticatedHomePath(user.role))}>Go to Dashboard</Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
