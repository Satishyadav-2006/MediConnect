import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { internshipService } from '@/api/internshipService'
import { extractList } from '@/lib/pagination'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import { Tabs, TabList, TabTrigger, TabContent } from '@/components/ui/Tabs'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import { NoJobsEmpty } from '@/components/empty-states'
import { formatDate, getStatusColor, cn } from '@/utils'

const STATUS_OPTIONS = [
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

type AppliedInternshipApplication = {
  application_id: string
  internship_id: string
  status: string
  applied_at: string | null
  created_at: string
  internship?: {
    internship_id: string
    title: string
    organization?: { name: string; logo?: string } | null
  } | null
}

function useAppliedInternships() {
  const { data, isLoading } = useQuery({
    queryKey: ['appliedInternships'],
    queryFn: () => internshipService.getAppliedInternships(1, 100).then(r => r.data),
  })
  return { data, isLoading }
}

export default function InternshipsAppliedPage() {
  const [activeFilter, setActiveFilter] = useState('all')
  const { data, isLoading } = useAppliedInternships()

  const applications = extractList<AppliedInternshipApplication>(data)
  const filtered = activeFilter === 'all' ? applications : applications.filter(a => a.status === activeFilter)

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">My Internship Applications</h1>

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
                        {app.internship?.organization?.logo ? (
                          <img src={app.internship.organization.logo} alt="" className="h-12 w-12 rounded-lg object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-primary-500">{app.internship?.organization?.name?.[0]}</span>
                        )}
                      </div>
                      <div>
                        <Link to={`/internships/${app.internship?.internship_id}`} className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-primary-500">
                          {app.internship?.title || 'Internship'}
                        </Link>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{app.internship?.organization?.name}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-[var(--color-text-muted)]">Applied {formatDate(app.applied_at || app.created_at)}</span>
                          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', getStatusColor(app.status))}>
                            {app.status?.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link to={`/internships/${app.internship?.internship_id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
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
