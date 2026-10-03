import { useState } from 'react'
import { useI18n } from '@/config/i18n'
import { motion } from 'framer-motion'
import { FiCheckCircle, FiClock, FiXCircle, FiFileText, FiExternalLink } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import { StatusBadge, EmptyState } from '@/components/ui'
import { Badge } from '@/components/ui'

export default function VerificationStatusPage() {
  const { t } = useI18n()
  const { user } = useAuth()

  const status = user?.accountStatus || 'pending'
  const statusConfig = {
    active: { icon: <FiCheckCircle size={48} />, color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-900/20', label: 'Verified', description: 'Your account has been professionally verified.' },
    pending: { icon: <FiClock size={48} />, color: 'text-warning-500', bg: 'bg-warning-50 dark:bg-warning-900/20', label: 'Under Review', description: 'Your verification request is being reviewed by our team.' },
    pending_professional_verification: { icon: <FiClock size={48} />, color: 'text-warning-500', bg: 'bg-warning-50 dark:bg-warning-900/20', label: 'Pending Verification', description: 'Please submit your professional documents for verification.' },
    rejected: { icon: <FiXCircle size={48} />, color: 'text-danger-500', bg: 'bg-danger-50 dark:bg-danger-900/20', label: 'Rejected', description: 'Your verification request was not approved. Please review the feedback and resubmit.' },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{t.verification.status}</h1>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-8 text-center"
      >
        <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${config.bg} ${config.color}`}>
          {config.icon}
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{config.label}</h2>
        <p className="mt-2 text-[var(--color-text-secondary)]">{config.description}</p>

        {status === 'rejected' && (
          <button className="mt-4 rounded-lg bg-primary-500 px-6 py-2 text-sm font-medium text-white hover:bg-primary-600">
            {t.verification.resubmit}
          </button>
        )}
      </motion.div>

      <div className="mt-6 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
        <h3 className="font-semibold text-[var(--color-text-primary)]">{t.verification.benefits}</h3>
        <ul className="mt-3 space-y-2">
          {[
            'Verified badge on your profile',
            'Higher visibility in search results',
            'Access to premium features',
            'Increased trust from employers and organizations',
            'Priority in job and internship recommendations',
          ].map((benefit, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <FiCheckCircle size={14} className="text-accent-500 shrink-0" />
              {benefit}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
