import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiPlus, FiFilter, FiClock, FiCheckCircle, FiXCircle, FiUserCheck, FiMessageSquare, FiBriefcase, FiBookmark } from 'react-icons/fi'
import { useJobs, useSavedJobs, useAppliedJobs, useSaveJob } from '@/features/jobs/hooks/useJobs'
import { JOB_TABS, EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, ROLES } from '@/constants'
import { useAuth } from '@/contexts/AuthContext'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import { Tabs, TabList, TabTrigger, TabContent } from '@/components/ui/Tabs'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import { NoJobsEmpty } from '@/components/empty-states'
import JobCard from '@/components/jobs/JobCard'
import Pagination from '@/components/ui/Pagination'
import { cn, formatDate } from '@/utils'
import { extractList, getPagination } from '@/lib/pagination'
import type { Job, JobApplication } from '@/types'

function JobCardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-4 w-40 mb-2" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}

const STATUS_FLOW = ['applied', 'under_review', 'shortlisted', 'interview', 'offer'] as const

const LEGACY_STATUS_ALIASES: Record<string, (typeof STATUS_FLOW)[number]> = {
  submitted: 'applied',
  reviewed: 'under_review',
  interview_scheduled: 'interview',
  interview_completed: 'interview',
  selected: 'offer',
  offer_sent: 'offer',
  offer_accepted: 'offer',
}

function normalizeApplicationStatus(status?: string | null): (typeof STATUS_FLOW)[number] {
  if (!status) return 'applied'
  return LEGACY_STATUS_ALIASES[status] ?? (status as (typeof STATUS_FLOW)[number])
}

const STATUS_CONFIG: Record<string, { icon: typeof FiClock; color: string; bg: string; label: string }> = {
  applied: { icon: FiClock, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Applied' },
  under_review: { icon: FiCheckCircle, color: 'text-purple-500', bg: 'bg-purple-100', label: 'Under Review' },
  shortlisted: { icon: FiUserCheck, color: 'text-indigo-500', bg: 'bg-indigo-100', label: 'Shortlisted' },
  interview: { icon: FiMessageSquare, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Interview' },
  offer: { icon: FiBriefcase, color: 'text-green-500', bg: 'bg-green-100', label: 'Offer' },
  rejected: { icon: FiXCircle, color: 'text-red-500', bg: 'bg-red-100', label: 'Rejected' },
  withdrawn: { icon: FiXCircle, color: 'text-gray-400', bg: 'bg-gray-100', label: 'Withdrawn' },
}

const BADGE_BY_STATUS: Record<string, 'success' | 'danger' | 'info' | 'default'> = {
  offer: 'success',
  rejected: 'danger',
  interview: 'info',
}

function ApplicationTimeline({ status }: { status: string }) {
  const normalized = normalizeApplicationStatus(status)
  const currentIdx = STATUS_FLOW.indexOf(normalized)
  const isRejected = status === 'rejected'
  const isWithdrawn = status === 'withdrawn'
  const isTerminal = isRejected || isWithdrawn || normalized === 'offer'

  return (
    <div className="flex items-center gap-1 w-full">
      {STATUS_FLOW.map((step, idx) => {
        const config = STATUS_CONFIG[step]
        const Icon = config.icon
        const isCompleted = !isTerminal && idx <= currentIdx
        const isCurrent = !isTerminal && idx === currentIdx
        const isRejectedStep = isRejected && idx === currentIdx

        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                isCompleted ? `${config.bg} ${config.color} border-transparent` : isRejectedStep ? `${STATUS_CONFIG.rejected.bg} ${STATUS_CONFIG.rejected.color} border-transparent` : 'bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)] text-[var(--color-text-muted)]'
              )}>
                <Icon size={14} />
              </div>
              <span className={cn(
                'text-[10px] mt-1 text-center whitespace-nowrap',
                isCompleted ? 'font-medium text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'
              )}>
                {config.label}
              </span>
            </div>
            {idx < STATUS_FLOW.length - 1 && (
              <div className={cn(
                'flex-1 h-0.5 mx-1 mt-[-16px]',
                !isTerminal && idx < currentIdx ? 'bg-primary-300' : 'bg-[var(--color-border-primary)]'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState('recommended')
  const [filters, setFilters] = useState<Record<string, unknown>>({})
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const { user } = useAuth()
  const canPostJobs = !!user && ROLES.RECRUITING.includes(user.role as typeof ROLES.RECRUITING[number])

  const { data: jobsData, isLoading: loadingJobs } = useJobs(activeTab === 'recommended' || activeTab === 'latest' ? { ...filters, sort: activeTab } : undefined)
  const { data: savedData, isLoading: loadingSaved } = useSavedJobs()
  const { data: appliedData, isLoading: loadingApplied } = useAppliedJobs()
  const saveJob = useSaveJob()

  const jobs = jobsData?.pages?.flatMap(p => extractList<Job>(p)) ?? []
  const savedJobs = savedData?.pages?.flatMap(p => extractList<Job>(p)) ?? []
  const appliedJobs = appliedData?.pages?.flatMap(p => extractList<JobApplication>(p)) ?? []
  const totalPages = getPagination(jobsData?.pages?.[0])?.totalPages || 1

  const clearFilters = () => { setFilters({}); setPage(1) }

  const FilterPanel = () => (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Filters</h3>
        <button onClick={clearFilters} className="text-xs text-primary-500 hover:text-primary-600">Clear all</button>
      </div>
      <Select
        label="Employment Type"
        options={EMPLOYMENT_TYPES.map(t => ({ value: t.value, label: t.label }))}
        value={filters.employmentType as string}
        onChange={(v) => setFilters(prev => ({ ...prev, employmentType: v }))}
        placeholder="Any type"
      />
      <Select
        label="Experience Level"
        options={EXPERIENCE_LEVELS.map(l => ({ value: l.value, label: l.label }))}
        value={filters.experienceLevel as string}
        onChange={(v) => setFilters(prev => ({ ...prev, experienceLevel: v }))}
        placeholder="Any level"
      />
      <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        <input type="checkbox" checked={!!filters.isRemote} onChange={e => setFilters(prev => ({ ...prev, isRemote: e.target.checked || undefined }))} className="rounded" />
        Remote only
      </label>
    </div>
  )

  const JobList = ({ data, isLoading }: { data: Job[]; isLoading: boolean }) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <JobCardSkeleton key={i} />)}
        </div>
      )
    }
    if (data.length === 0) return <NoJobsEmpty />
    return (
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.map(job => (
          <motion.div key={job._id} variants={staggerItem}>
            <JobCard job={job} onSave={(id) => saveJob.mutate({ id, isSaved: job.isSaved })} />
          </motion.div>
        ))}
      </motion.div>
    )
  }

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Jobs</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<FiFilter size={14} />} onClick={() => setShowFilters(!showFilters)}>
            Filters
          </Button>
          {canPostJobs && (
            <Link to="/jobs/create">
              <Button size="sm" leftIcon={<FiPlus size={14} />}>Post Job</Button>
            </Link>
          )}
        </div>
      </div>

      {showFilters && <FilterPanel />}

      <Tabs defaultValue="recommended">
        <TabList>
          {JOB_TABS.map(tab => (
            <TabTrigger key={tab.value} value={tab.value} onClick={() => setActiveTab(tab.value)}>
              {tab.label}
            </TabTrigger>
          ))}
        </TabList>

        <TabContent value="recommended">
          <JobList data={jobs} isLoading={loadingJobs} />
          {activeTab === 'recommended' && totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-6" />}
        </TabContent>

        <TabContent value="latest">
          <JobList data={jobs} isLoading={loadingJobs} />
        </TabContent>

        <TabContent value="saved">
          <JobList data={savedJobs} isLoading={loadingSaved} />
        </TabContent>

        <TabContent value="applied">
          {loadingApplied ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3].map(i => <JobCardSkeleton key={i} />)}
            </div>
          ) : appliedJobs.length === 0 ? (
            <NoJobsEmpty />
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
              {appliedJobs.map(app => {
                const statusConf = STATUS_CONFIG[app.status] || STATUS_CONFIG[normalizeApplicationStatus(app.status)]
                const StatusIcon = statusConf.icon
                return (
                  <motion.div key={app._id} variants={staggerItem} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center shrink-0">
                          {app.job?.organization?.logo ? (
                            <img src={app.job.organization.logo} alt="" className="h-12 w-12 rounded-lg object-cover" />
                          ) : (
                            <FiBriefcase size={18} className="text-primary-500" />
                          )}
                        </div>
                        <div>
                          <Link to={`/jobs/${app.job?._id || app._id}`} className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-primary-500">
                            {app.job?.title || 'Job'}
                          </Link>
                          <p className="text-xs text-[var(--color-text-secondary)]">{app.job?.organization?.name || 'Organization'}</p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Badge variant={BADGE_BY_STATUS[normalizeApplicationStatus(app.status)] ?? 'default'} size="sm">
                        {statusConf.label}
                      </Badge>
                    </div>

                    <div className="mt-4">
                      <ApplicationTimeline status={app.status} />
                    </div>

                    {['applied', 'under_review'].includes(normalizeApplicationStatus(app.status)) && (
                      <div className="mt-3 flex justify-end">
                        <Button variant="ghost" size="sm" className="text-[var(--color-text-muted)] hover:text-danger-500">
                          Withdraw Application
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </TabContent>
      </Tabs>
    </motion.div>
  )
}
