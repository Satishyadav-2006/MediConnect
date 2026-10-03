import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useI18n } from '@/config/i18n'
import { FiCheckCircle, FiXCircle, FiChevronRight, FiUserCheck } from 'react-icons/fi'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ConfirmationDialog from '@/components/ui/ConfirmationDialog'
import { useMentorStatus, useApplyAsMentor, useOptOutMentor } from '@/features/mentorship/hooks/useMentors'
import type { MentorCriterion } from '@/types'

interface ChecklistItemProps {
  met: boolean
  label: string
}

function ChecklistItem({ met, label }: ChecklistItemProps) {
  return (
    <li className="flex items-center gap-3">
      {met
        ? <FiCheckCircle size={18} className="shrink-0 text-green-500" />
        : <FiXCircle size={18} className="shrink-0 text-danger-500" />}
      <span className={met ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}>{label}</span>
    </li>
  )
}

export default function MentorOptInBanner() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { data: status, isLoading } = useMentorStatus()
  const apply = useApplyAsMentor()
  const optOut = useOptOutMentor()

  const [showConfirm, setShowConfirm] = useState(false)
  const [showChecklist, setShowChecklist] = useState(false)
  const [confirmOptOut, setConfirmOptOut] = useState(false)

  if (isLoading || !status) return null

  const criteria: MentorCriterion[] = status.criteria ?? []
  const unmet = criteria.filter(c => !c.met).length

  const handleOptInClick = () => {
    if (status.eligible || unmet === 0) {
      setShowConfirm(true)
    } else {
      setShowChecklist(true)
    }
  }

  const handleConfirmOptIn = async () => {
    try {
      await apply.mutateAsync()
      setShowConfirm(false)
      toast.success(t.mentorship.applySuccess)
    } catch {
      toast.error(t.mentorship.applyFailed)
      setShowConfirm(false)
      setShowChecklist(true)
    }
  }

  return (
    <>
      {status.isMentor ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-primary-500/30 bg-primary-500/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <FiUserCheck size={20} className="shrink-0 text-primary-500" />
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">{t.mentorship.mentorAvailableBanner}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">{t.mentorship.mentorAvailableBlurb}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmOptOut(true)}
            isLoading={optOut.isPending}
            className="shrink-0"
          >
            {t.mentorship.optOut}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3">
          <div className="flex items-center gap-3">
            <FiUserCheck size={20} className="shrink-0 text-primary-500" />
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">{t.mentorship.becomeMentorQuestion}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">{t.mentorship.becomeMentorBlurb}</p>
              {unmet > 0 && (
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  {t.mentorship.requirementsMissing} ({unmet} {unmet === 1 ? 'requirement' : 'requirements'})
                </p>
              )}
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={handleOptInClick} className="shrink-0">
            {t.mentorship.availableNow}
          </Button>
        </div>
      )}

      <ConfirmationDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmOptIn}
        title={t.mentorship.confirmOptInTitle}
        message={t.mentorship.confirmOptInMessage}
        confirmText={t.mentorship.availableNow}
        cancelText="Cancel"
        variant="info"
        loading={apply.isPending}
      />

      <ConfirmationDialog
        isOpen={confirmOptOut}
        onClose={() => setConfirmOptOut(false)}
        onConfirm={async () => {
          try {
            await optOut.mutateAsync()
            setConfirmOptOut(false)
            toast.success(t.mentorship.optOutSuccess)
          } catch {
            toast.error(t.mentorship.optOutFailed)
          }
        }}
        title={t.mentorship.optOutTitle}
        message={t.mentorship.optOutMessage}
        confirmText={t.mentorship.optOut}
        cancelText="Cancel"
        variant="warning"
        loading={optOut.isPending}
      />

      <Modal isOpen={showChecklist} onClose={() => setShowChecklist(false)} size="md">
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{t.mentorship.requirementsTitle}</h3>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {unmet === 0 ? t.mentorship.requirementsMet : t.mentorship.requirementsMissing}
            </p>
          </div>
          <ul className="space-y-3">
            {criteria.map(c => <ChecklistItem key={c.key} met={c.met} label={c.label} />)}
          </ul>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowChecklist(false)}>Cancel</Button>
            {unmet > 0 ? (
              <Button rightIcon={<FiChevronRight size={16} />} onClick={() => navigate('/profile/edit')}>
                {t.mentorship.completeProfile}
              </Button>
            ) : (
              <Button onClick={() => { setShowChecklist(false); setShowConfirm(true) }}>
                {t.mentorship.availableNow}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}