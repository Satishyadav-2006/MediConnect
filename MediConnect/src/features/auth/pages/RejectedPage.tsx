import { motion } from 'framer-motion'
import { FiXCircle, FiMail, FiLogOut, FiRefreshCw, FiAlertOctagon } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { pageTransition } from '@/animations'
import Button from '@/components/ui/Button'
import { ROUTES } from '@/constants/routes'

export default function RejectedPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const rejectionReason = (user as unknown as Record<string, unknown>)?.rejectionReason as string | undefined

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-secondary)] px-4">
      <motion.div className="w-full max-w-md text-center" {...pageTransition}>
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-8 shadow-sm">
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
            Unfortunately, your professional verification request has been denied.
            This may be due to incomplete documentation, invalid credentials, or failure to meet our verification standards.
          </p>

          {rejectionReason && (
            <div className="mt-4 rounded-lg border border-danger-100 bg-danger-50 p-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <FiAlertOctagon size={16} className="text-danger-500" />
                <span className="text-sm font-semibold text-danger-600">Reason</span>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{rejectionReason}</p>
            </div>
          )}

          <p className="mt-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
            If you believe this is an error or you have additional documentation to provide, please contact our support team for further assistance.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Button
              fullWidth
              leftIcon={<FiRefreshCw size={16} />}
              onClick={() => navigate(ROUTES.REGISTER)}
            >
              Resubmit Application
            </Button>
            <a href="mailto:support@mediconnect.com">
              <Button variant="outline" fullWidth leftIcon={<FiMail size={16} />}>
                Contact Support
              </Button>
            </a>
            <Button variant="ghost" fullWidth leftIcon={<FiLogOut size={16} />} onClick={logout}>
              Log Out
            </Button>
          </div>

          <p className="mt-4 text-xs text-[var(--color-text-muted)]">
            Support email: support@mediconnect.com
          </p>
        </div>
      </motion.div>
    </div>
  )
}
