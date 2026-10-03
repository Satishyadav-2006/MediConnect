import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobService } from '@/api/jobService'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import { Tabs, TabList, TabTrigger, TabContent } from '@/components/ui/Tabs'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import { NoJobsEmpty } from '@/components/empty-states'
import { formatDate, getStatusColor, cn } from '@/utils'
import { extractList } from '@/lib/pagination'
import type { ApplicationStatus } from '@/types'

type AppliedJob = {
  application_id: string
  job_id: string
  status: ApplicationStatus
  applied_at: string | null
  created_at: string
  job?: {
    job_id: string
    title: string
    location?: string | null
    organization?: { organization_id: string; name: string; logo?: string | null } | null
  } | null
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'applied', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview_scheduled', label: 'Interview' },
  { value: 'selected', label: 'Selected' },
  { value: 'offer_sent', label: 'Offered' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
]

function useAppliedJobsList() {
  const { data, isLoading } = useQuery({
    queryKey: ['appliedJobs'],
    queryFn: () => jobService.getAppliedJobs(1, 100).then(r => r.data),
  })
  return { data, isLoading }
}

function useWithdrawApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (jobId: string) => jobService.withdrawApplication(jobId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appliedJobs'] })
      toast.success('Application withdrawn')
    },
    onError: () => toast.error('Failed to withdraw application'),
  })
}

export default function JobsAppliedPage() {
  const [activeFilter, setActiveFilter] = useState('all')
  const { data, isLoading } = useAppliedJobsList()
  const withdrawMutation = useWithdrawApplication()

  const applications = extractList<AppliedJob>(data)
  const filtered = activeFilter === 'all' ? applications : applications.filter(a => a.status === activeFilter)

  const handleWithdraw = (jobId: string) => {
    if (window.confirm('Are you sure you want to withdraw this application?')) {
      withdrawMutation.mutate(jobId)
    }
  }

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">My Applications</h1>

      <Tabs defaultValue="all">
        <TabList>
          {STATUS_OPTIONS.map(opt => (
            <TabTrigger key={opt.value} value={opt.value} onClick={() => setActiveFilter(opt.value)}>
              {opt.label}
            </TabTrigger>
          ))}
        </TabList>

        <TabContent value={activeFilter}>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <NoJobsEmpty />
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
              {filtered.map(app => (
                <motion.div key={app.application_id} variants={staggerItem} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center shrink-0">
                        {app.job?.organization?.logo ? (
                          <img src={app.job.organization.logo} alt="" className="h-12 w-12 rounded-lg object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-primary-500">{app.job?.organization?.name?.[0]}</span>
                        )}
                      </div>
                      <div>
                        <Link to={`/jobs/${app.job?.job_id}`} className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-primary-500">
                          {app.job?.title || 'Job'}
                        </Link>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{app.job?.organization?.name}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-[var(--color-text-muted)]">Applied {formatDate(app.applied_at || app.created_at)}</span>
                          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', getStatusColor(app.status))}>
                            {app.status?.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={`/jobs/${app.job?.job_id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                      {app.status === 'applied' && (
                        <Button variant="ghost" size="sm" onClick={() => handleWithdraw(app.job_id)} disabled={withdrawMutation.isPending}>
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabContent>
      </Tabs>
    </motion.div>
  )
}
