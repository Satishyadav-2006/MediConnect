import { useState } from 'react'
import { FiBriefcase, FiSearch, FiSliders } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import { extractList, getPagination } from '@/lib/pagination'
import { adminService } from '@/api/adminService'
import { useAdminDeleteJob, useAdminUpdateJobStatus } from '@/features/admin/hooks/useAdmin'
import { useI18n } from '@/config/i18n'
import { formatDate } from '@/utils'
import {
  AdminEmpty,
  AdminPage,
  AdminPageHeader,
  AdminTableBody,
  AdminTableHead,
  AdminTableRow,
  AdminTableShell,
  AdminToolbar,
  AdminToneChip,
  adminTd,
  adminTh,
  statusTone,
} from '@/components/admin'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Pagination from '@/components/ui/Pagination'
import TableSkeleton from '@/components/skeletons/TableSkeleton'

interface AdminJob {
  job_id: string
  title: string
  organization?: { name?: string }
  location?: string
  job_type?: string
  work_mode?: string
  vacancies?: number
  application_count?: number
  status: string
  deadline?: string | null
  created_at: string
}

export default function AdminJobsPage() {
  const { t } = useI18n()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['adminJobs', page, search, statusFilter],
    queryFn: () => adminService.getJobs({
      page,
      per_page: 20,
      search: search || undefined,
      job_status: statusFilter || undefined,
    }).then(r => r.data),
  })

  const deleteJob = useAdminDeleteJob()
  const updateStatus = useAdminUpdateJobStatus()
  const jobs = extractList<AdminJob>(data)
  const pagination = getPagination(data)
  const hasFilters = Boolean(search || statusFilter)

  return (
    <AdminPage>
      <AdminPageHeader
        title={t.admin.titles.jobs}
        subtitle={t.admin.subtitle.jobs}
        icon={<FiBriefcase size={20} />}
      />
      <AdminToolbar>
        <FiSliders size={16} className="hidden shrink-0 text-[var(--color-text-muted)] sm:block" />
        <Input
          placeholder={t.admin.searchJobs}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="min-w-[220px] flex-1"
        />
        <Select
          options={[
            { value: '', label: `${t.admin.columns.status}: ${t.admin.filters.all}` },
            { value: 'published', label: 'Published' },
            { value: 'draft', label: 'Draft' },
            { value: 'closed', label: 'Closed' },
            { value: 'expired', label: 'Expired' },
          ]}
          value={statusFilter}
          onChange={v => { setStatusFilter(v); setPage(1) }}
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter(''); setPage(1) }}>
            {t.admin.filters.clear}
          </Button>
        )}
      </AdminToolbar>

      {isLoading ? (
        <AdminTableShell><TableSkeleton rows={8} /></AdminTableShell>
      ) : jobs.length === 0 ? (
        <AdminEmpty title={t.admin.states.emptyJobs} description={t.admin.states.emptyJobsHint} icon={<FiSearch size={20} />} />
      ) : (
        <AdminTableShell>
          <table className="w-full">
            <AdminTableHead>
              <th className={adminTh}>{t.admin.titles.jobs}</th>
              <th className={adminTh}>{t.admin.columns.organization}</th>
              <th className={`${adminTh} hidden md:table-cell`}>Details</th>
              <th className={adminTh}>{t.admin.columns.status}</th>
              <th className={`${adminTh} whitespace-nowrap`}>{t.admin.columns.date}</th>
              <th className={`${adminTh} text-right`}>{t.admin.columns.actions}</th>
            </AdminTableHead>
            <AdminTableBody>
              {jobs.map(job => (
                <AdminTableRow key={job.job_id}>
                  <td className={adminTd}>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{job.title}</p>
                    {(job.location || job.job_type || job.work_mode) && (
                      <p className="text-xs text-[var(--color-text-muted)]">{[job.location, job.job_type, job.work_mode].filter(Boolean).join(' · ')}</p>
                    )}
                  </td>
                  <td className={adminTd}>{job.organization?.name || '—'}</td>
                  <td className={`${adminTd} hidden md:table-cell`}>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--color-text-muted)]">
                      {job.vacancies !== undefined && <span>{t.admin.vacancies}: {job.vacancies}</span>}
                      {job.application_count !== undefined && <span>{t.admin.applications}: {job.application_count}</span>}
                      {job.deadline && <span>{t.admin.deadline}: {formatDate(job.deadline)}</span>}
                    </div>
                  </td>
                  <td className={adminTd}><AdminToneChip tone={statusTone(job.status)}>{job.status?.replace(/_/g, ' ')}</AdminToneChip></td>
                  <td className={`${adminTd} whitespace-nowrap text-xs text-[var(--color-text-muted)]`}>{formatDate(job.created_at)}</td>
                  <td className={`${adminTd} text-right`}>
                    <div className="flex justify-end gap-1">
                      {job.status !== 'published' && (
                        <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ jobId: job.job_id, status: 'published' })} isLoading={updateStatus.isPending}>Publish</Button>
                      )}
                      {job.status !== 'closed' && (
                        <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ jobId: job.job_id, status: 'closed' })} isLoading={updateStatus.isPending}>Close</Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-danger-500" onClick={() => { if (confirm(`${t.common.delete}?`)) deleteJob.mutate(job.job_id) }} isLoading={deleteJob.isPending}>{t.common.delete}</Button>
                    </div>
                  </td>
                </AdminTableRow>
              ))}
            </AdminTableBody>
          </table>
        </AdminTableShell>
      )}
      {pagination && pagination.totalPages > 1 && <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />}
    </AdminPage>
  )
}