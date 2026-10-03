import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobService } from '@/api/jobService'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import { NoApplicationsEmpty } from '@/components/empty-states'
import { formatDate, getStatusColor, cn } from '@/utils'
import { extractList } from '@/lib/pagination'
import type { JobApplicationRow, ApplicationStatus } from '@/types'

const FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'applied', label: 'Applied' },
  { value: 'under_review', label: 'Under review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview_scheduled', label: 'Interview' },
  { value: 'selected', label: 'Selected' },
  { value: 'offer_sent', label: 'Offer sent' },
  { value: 'rejected', label: 'Rejected' },
]

const NEXT_STATUSES: { value: ApplicationStatus; label: string }[] = [
  { value: 'under_review', label: 'Start review' },
  { value: 'shortlisted', label: 'Shortlist' },
  { value: 'interview_scheduled', label: 'Schedule interview' },
  { value: 'selected', label: 'Select' },
  { value: 'offer_sent', label: 'Send offer' },
  { value: 'rejected', label: 'Reject' },
]

const formatStatus = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

function usePostedApplications(status?: string) {
  return useQuery({
    queryKey: ['postedJobApplications', status ?? 'all'],
    queryFn: () => jobService.getPostedApplications(1, 100, status).then(r => r.data),
  })
}

function useUpdateStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      jobService.updateApplicationStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['postedJobApplications'] })
      toast.success('Application status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })
}

export default function JobApplicantsPage() {
  const [filter, setFilter] = useState('all')
  const { data, isLoading } = usePostedApplications(filter === 'all' ? undefined : filter)
  const update = useUpdateStatus()

  const rows = extractList<JobApplicationRow>(data)

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Job Applicants</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Everyone who applied to your job postings
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                filter === f.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : rows.length === 0 ? (
        <NoApplicationsEmpty />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
          {rows.map(app => (
            <motion.div
              key={app.application_id}
              variants={staggerItem}
              className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[var(--color-bg-tertiary)]">
                    {app.user?.profile_photo ? (
                      <img src={app.user.profile_photo} alt="" className="h-12 w-12 object-cover" />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center text-sm font-bold text-primary-500">
                        {app.user?.full_name?.[0] ?? '?'}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {app.user?.full_name || 'Applicant'}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{app.user?.headline || app.user?.role || '—'}</p>
                    {app.user?.email && (
                      <a
                        href={`mailto:${app.user.email}`}
                        className="text-xs text-primary-500 hover:underline"
                      >
                        {app.user.email}
                      </a>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                      {app.job && (
                        <Link
                          to={`/jobs/${app.job.job_id}`}
                          className="font-medium text-[var(--color-text-primary)] hover:text-primary-500"
                        >
                          {app.job.title}
                        </Link>
                      )}
                      <span className="text-[var(--color-text-muted)]">
                        Applied {formatDate(app.applied_at || app.created_at)}
                      </span>
                      <span className={cn('rounded-full px-2 py-0.5 font-medium', getStatusColor(app.status))}>
                        {formatStatus(app.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {app.resume_url && (
                    <a href={app.resume_url} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="sm">Resume</Button>
                    </a>
                  )}
                  <select
                    value={app.status}
                    disabled={update.isPending}
                    onChange={e => update.mutate({ id: app.application_id, status: e.target.value as ApplicationStatus })}
                    className="rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-2 py-1 text-xs text-[var(--color-text-primary)]"
                  >
                    {NEXT_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {app.cover_letter && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-medium text-[var(--color-text-secondary)]">
                    Cover letter
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-[var(--color-text-secondary)]">
                    {app.cover_letter}
                  </p>
                </details>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
