import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiClock, FiMail, FiLogOut, FiShield, FiCheckCircle, FiUploadCloud } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'

export default function PendingVerificationPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-secondary)] px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-8 shadow-sm">
          <div className="relative mx-auto mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-warning-50"
            >
              {user?.accountStatus === 'pending_professional_verification' && user?.verificationStatus === 'pending' ? (
                <FiUploadCloud size={48} className="text-warning-500" />
              ) : (
                <FiClock size={48} className="text-warning-500" />
              )}
            </motion.div>
          </div>

          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {user?.accountStatus === 'pending_professional_verification' && user?.verificationStatus === 'pending'
              ? 'Professional Verification Required'
              : 'Verification Under Review'}
          </h1>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {user?.accountStatus === 'pending_professional_verification' && user?.verificationStatus === 'pending'
              ? `Welcome${user?.fullName ? `, ${user.fullName}` : ''}. Please submit your professional documents to verify your credentials and access all platform features.`
              : `Thank you for registering${user?.fullName ? `, ${user.fullName}` : ''}. Your professional credentials are currently being reviewed by our verification team.`}
          </p>

          {user?.accountStatus === 'pending_professional_verification' && user?.verificationStatus === 'pending' ? (
            <div className="mt-6 space-y-3">
              <Button fullWidth size="lg" onClick={() => navigate('/verification-request')}>
                Submit Documents for Verification
              </Button>
              <p className="text-xs text-[var(--color-text-muted)]">
                You will not be able to access platform features until verification is complete.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-6 rounded-lg bg-[var(--color-bg-secondary)] p-4 text-left">
                <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Expected Timeline</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-50">
                      <FiCheckCircle size={14} className="text-accent-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">Credentials submitted</p>
                      <p className="text-xs text-[var(--color-text-muted)]">Your documents have been received</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warning-100">
                      <div className="h-2 w-2 rounded-full bg-warning-500 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">Under review</p>
                      <p className="text-xs text-[var(--color-text-muted)]">Typically takes 1-3 business days</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-tertiary)]">
                      <div className="h-2 w-2 rounded-full bg-[var(--color-text-muted)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-muted)]">Email notification</p>
                      <p className="text-xs text-[var(--color-text-muted)]">You will receive an email once approved</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-[var(--color-text-muted)]">
                You will not be able to access platform features until verification is complete.
              </p>
              <div className="mt-6 space-y-3">
                <Button variant="ghost" fullWidth onClick={() => navigate('/verification-status')}>
                  Check Verification Status
                </Button>
              </div>
            </>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <a href="mailto:support@mediconnect.com">
              <Button variant="outline" fullWidth leftIcon={<FiMail size={16} />}>
                Contact Support
              </Button>
            </a>
            <Button variant="ghost" fullWidth leftIcon={<FiLogOut size={16} />} onClick={logout}>
              Log Out
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
