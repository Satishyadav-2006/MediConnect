import { useState } from 'react'
import { extractList } from '@/lib/pagination'
import { FiShield, FiCheckCircle, FiXCircle, FiHelpCircle } from 'react-icons/fi'
import {
  useAdminApproveVerification,
  useAdminRejectVerification,
  useAdminRequestMoreInformation,
  useAdminVerificationRequests,
} from '@/features/admin/hooks/useAdmin'
import { useI18n } from '@/config/i18n'
import {
  AdminEmpty,
  AdminLoadingCards,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminToneChip,
  statusTone,
} from '@/components/admin'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'
import { formatDate } from '@/utils'

interface VerificationRequest {
  _id: string
  user_id: string
  verification_id: string | null
  fullName: string
  email: string
  role: string
  verification_status: string
  account_status: string
  registration_number?: string
  license_number?: string
  specialization?: string
  profile_photo?: string | null
  created_at: string
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      <p className="truncate text-sm text-[var(--color-text-primary)]">{value}</p>
    </div>
  )
}

export default function AdminVerificationPage() {
  const { t } = useI18n()
  const [rejectModal, setRejectModal] = useState<{ userId: string; fullName: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [infoModal, setInfoModal] = useState<{ userId: string; fullName: string } | null>(null)
  const [infoRemarks, setInfoRemarks] = useState('')

  const { data, isLoading } = useAdminVerificationRequests()
  const approve = useAdminApproveVerification()
  const reject = useAdminRejectVerification()
  const requestInfo = useAdminRequestMoreInformation()

  const requests = extractList<VerificationRequest>(data)
  const pendingCount = requests.filter(r => r.verification_status !== 'approved' && r.verification_status !== 'rejected').length

  return (
    <AdminPage>
      <AdminPageHeader
        title={t.admin.titles.verification}
        subtitle={t.admin.subtitle.verification}
        icon={<FiShield size={20} />}
      >
        <span className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur-sm">
          {pendingCount} {t.admin.pending}
        </span>
      </AdminPageHeader>

      {isLoading ? (
        <AdminLoadingCards count={3} className="h-28" />
      ) : requests.length === 0 ? (
        <AdminEmpty
          title={t.admin.states.emptyVerification}
          description={t.admin.states.emptyVerificationHint}
          icon={<FiShield size={20} />}
        />
      ) : (
        <div className="grid gap-4">
          {requests.map(req => {
            const tone = statusTone(req.verification_status)
            const isApproved = req.verification_status === 'approved'
            const isRejected = req.verification_status === 'rejected'
            return (
              <AdminPanel key={req.user_id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar src={req.profile_photo || undefined} name={req.fullName} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{req.fullName}</p>
                      <p className="truncate text-xs text-[var(--color-text-secondary)]">{req.email}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="primary" size="sm">{req.role?.replace(/_/g, ' ')}</Badge>
                        <AdminToneChip tone={tone}>{req.verification_status?.replace(/_/g, ' ')}</AdminToneChip>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {t.admin.applied} {formatDate(req.created_at)}
                        </span>
                      </div>
                      {(req.specialization || req.registration_number || req.license_number) && (
                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {req.specialization && <Field label={t.admin.specialization} value={req.specialization} />}
                          {req.registration_number && <Field label={t.admin.registration} value={req.registration_number} />}
                          {req.license_number && <Field label={t.admin.license} value={req.license_number} />}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      size="sm"
                      isLoading={approve.isPending}
                      disabled={isApproved}
                      onClick={() => approve.mutate(req.user_id)}
                    >
                      <FiCheckCircle size={14} className="mr-1.5" />
                      {t.admin.approve}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isRejected}
                      onClick={() => setRejectModal({ userId: req.user_id, fullName: req.fullName })}
                    >
                      <FiXCircle size={14} className="mr-1.5" />
                      {t.admin.reject}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      isLoading={requestInfo.isPending}
                      disabled={isApproved || isRejected}
                      onClick={() => setInfoModal({ userId: req.user_id, fullName: req.fullName })}
                    >
                      <FiHelpCircle size={14} className="mr-1.5" />
                      {t.admin.requestInfo}
                    </Button>
                  </div>
                </div>
              </AdminPanel>
            )
          })}
        </div>
      )}

      {rejectModal && (
        <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)}>
          <div className="p-6">
            <h2 className="mb-2 text-lg font-bold text-[var(--color-text-primary)]">{t.admin.reject}</h2>
            <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
              {rejectModal.fullName}
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder={t.admin.rejectionReason}
              rows={3}
              className="mb-4 w-full resize-none rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setRejectModal(null)}>{t.common.cancel}</Button>
              <Button
                variant="danger"
                onClick={() => reject.mutate({ userId: rejectModal.userId, reason: rejectReason })}
                isLoading={reject.isPending}
                disabled={!rejectReason.trim()}
              >
                {t.admin.reject}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {infoModal && (
        <Modal isOpen={!!infoModal} onClose={() => setInfoModal(null)}>
          <div className="p-6">
            <h2 className="mb-2 text-lg font-bold text-[var(--color-text-primary)]">{t.admin.requestInfo}</h2>
            <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
              {infoModal.fullName} — {t.admin.requestInfoHint}
            </p>
            <textarea
              value={infoRemarks}
              onChange={e => setInfoRemarks(e.target.value)}
              placeholder={t.admin.requestInfoHint}
              rows={3}
              className="mb-4 w-full resize-none rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setInfoModal(null)}>{t.common.cancel}</Button>
              <Button
                onClick={() =>
                  requestInfo.mutate(
                    { userId: infoModal.userId, remarks: infoRemarks },
                    {
                      onSuccess: () => {
                        setInfoModal(null)
                        setInfoRemarks('')
                      },
                    },
                  )
                }
                isLoading={requestInfo.isPending}
                disabled={!infoRemarks.trim()}
              >
                {t.admin.sendRequest}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </AdminPage>
  )
}