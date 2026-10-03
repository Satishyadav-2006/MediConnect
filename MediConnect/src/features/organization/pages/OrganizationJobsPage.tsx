import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiPlus, FiFilter } from 'react-icons/fi'
import { useOrganizationJobs } from '@/features/organization/hooks/useOrganization'
import { useResolvedOrgId } from '@/features/organization/context/CurrentOrganizationContext'
import { ROUTES } from '@/constants/routes'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import JobCard from '@/components/jobs/JobCard'
import { JobCardSkeleton } from '@/components/skeletons'
import { NoJobsEmpty } from '@/components/empty-states'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Pagination from '@/components/ui/Pagination'
import { extractList, getPagination } from '@/lib/pagination'
import type { Job } from '@/types'

export default function OrganizationJobsPage() {
  const orgId = useResolvedOrgId()
  const { id: routeId } = useParams()
  const inOrgWorkspace = !routeId
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useOrganizationJobs(orgId)
  const jobs = data?.pages?.flatMap(p => extractList<Job>(p)) ?? []
  const totalPages = getPagination(data?.pages?.[0])?.totalPages || 1

  const filteredJobs = statusFilter
    ? jobs.filter(j => j.status === statusFilter)
    : jobs

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Open Positions</h2>
        <div className="flex gap-2">
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'closed', label: 'Closed' },
              { value: 'draft', label: 'Draft' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Status"
          />
          <Link to={inOrgWorkspace ? ROUTES.ORG_JOB_CREATE : '/jobs/create'}>
            <Button size="sm" leftIcon={<FiPlus size={14} />}>Post Job</Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <JobCardSkeleton key={i} />)}
        </div>
      ) : filteredJobs.length === 0 ? (
        <NoJobsEmpty />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredJobs.map(job => (
            <motion.div key={job._id} variants={staggerItem}>
              <JobCard job={job} href={inOrgWorkspace ? `/org/jobs/${job._id}` : undefined} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-6" />}
    </motion.div>
  )
}
