import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiPlus, FiMapPin, FiClock, FiDollarSign } from 'react-icons/fi'
import { Link, useParams } from 'react-router-dom'
import { useOrganizationInternships } from '@/features/organization/hooks/useOrganization'
import { useResolvedOrgId } from '@/features/organization/context/CurrentOrganizationContext'
import { ROUTES } from '@/constants/routes'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import Pagination from '@/components/ui/Pagination'
import { NoJobsEmpty } from '@/components/empty-states'
import { formatDate, formatCurrency } from '@/utils'
import { extractList, getPagination } from '@/lib/pagination'
import type { Internship } from '@/types'

export default function OrganizationInternshipsPage() {
  const orgId = useResolvedOrgId()
  const { id: routeId } = useParams()
  const inOrgWorkspace = !routeId
  const [page, setPage] = useState(1)

  const { data, isLoading } = useOrganizationInternships(orgId)
  const internships = data?.pages?.flatMap(p => extractList<Internship>(p)) ?? []
  const totalPages = getPagination(data?.pages?.[0])?.totalPages || 1

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Internships</h2>
        <Link to={inOrgWorkspace ? ROUTES.ORG_INTERNSHIP_CREATE : '/internships/create'}>
          <Button size="sm" leftIcon={<FiPlus size={14} />}>Post Internship</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-3 w-32 mb-2" />
              <Skeleton className="h-3 w-64" />
            </div>
          ))}
        </div>
      ) : internships.length === 0 ? (
        <NoJobsEmpty />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
          {internships.map(internship => (
            <motion.div key={internship._id} variants={staggerItem}>
              <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <Link to={inOrgWorkspace ? `/org/internships/${internship._id}` : `/internships/${internship._id}`} className="flex-1">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-primary-500">{internship.title}</h3>
                  </Link>
                  <Badge variant={internship.status === 'active' ? 'success' : 'default'} size="sm">{internship.status}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)]">
                  <span className="flex items-center gap-1"><FiClock size={12} />{internship.duration}</span>
                  {internship.location && <span className="flex items-center gap-1"><FiMapPin size={12} />{internship.location}</span>}
                  {internship.isRemote && <Badge variant="info" size="sm">Remote</Badge>}
                  <Badge variant={internship.type === 'paid' ? 'success' : internship.type === 'stipend' ? 'warning' : 'default'} size="sm">
                    {internship.type === 'stipend' ? `${formatCurrency(internship.stipend || 0)} stipend` : internship.type}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-[var(--color-text-secondary)] line-clamp-2">{internship.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {internship.skills.slice(0, 4).map(skill => (
                    <span key={skill} className="rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-[10px] text-[var(--color-text-secondary)]">{skill}</span>
                  ))}
                </div>
                {internship.applicationDeadline && (
                  <p className="mt-2 text-[10px] text-[var(--color-text-muted)]">Deadline: {formatDate(internship.applicationDeadline)}</p>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-6" />}
    </motion.div>
  )
}
