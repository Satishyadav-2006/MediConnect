import { motion } from 'framer-motion'
import { FiAlertTriangle, FiMail, FiLogOut, FiFileText } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import { pageTransition } from '@/animations'
import Button from '@/components/ui/Button'

export default function SuspendedPage() {
  const { user, logout } = useAuth()

  const suspensionReason = (user as unknown as Record<string, unknown>)?.suspensionReason as string | undefined

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-secondary)] px-4">
      <motion.div className="w-full max-w-md text-center" {...pageTransition}>
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-8 shadow-sm">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-warning-50"
          >
            <FiAlertTriangle size={40} className="text-warning-500" />
          </motion.div>

          <h1 className="mt-6 text-2xl font-bold text-[var(--color-text-primary)]">Account Suspended</h1>

          <p className="mt-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Your account has been suspended due to a violation of our community guidelines or terms of service.
          </p>

          {suspensionReason && (
            <div className="mt-4 rounded-lg border border-warning-100 bg-warning-50 p-4 text-left">
              <p className="text-sm font-semibold text-warning-600 mb-1">Suspension Reason</p>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{suspensionReason}</p>
            </div>
          )}

          <p className="mt-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
            During the suspension period, you will not be able to access your account or use platform features.
            Please contact our support team for more information about your suspension and the steps to restore your account.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <a href="mailto:support@mediconnect.com?subject=Account%20Suspension%20Appeal">
              <Button variant="outline" fullWidth leftIcon={<FiFileText size={16} />}>
                Submit Appeal
              </Button>
            </a>
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
