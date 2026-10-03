import { useState } from 'react'
import { FiBookOpen, FiSearch, FiSliders } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import { extractList, getPagination } from '@/lib/pagination'
import { adminService } from '@/api/adminService'
import { useAdminDeleteInternship, useAdminUpdateInternshipStatus } from '@/features/admin/hooks/useAdmin'
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

interface AdminInternship {
  internship_id: string
  title: string
  organization?: { name?: string }
  location?: string
  internship_type?: string
  work_mode?: string
  duration?: string
  stipend?: string
  application_count?: number
  status: string
  deadline?: string | null
  created_at: string
}

export default function AdminInternshipsPage() {
  const { t } = useI18n()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['adminInternships', page, search, statusFilter],
    queryFn: () => adminService.getInternships({
      page,
      per_page: 20,
      search: search || undefined,
      internship_status: statusFilter || undefined,
    }).then(r => r.data),
  })

  const deleteInternship = useAdminDeleteInternship()
  const updateStatus = useAdminUpdateInternshipStatus()
  const internships = extractList<AdminInternship>(data)
  const pagination = getPagination(data)
  const hasFilters = Boolean(search || statusFilter)

  return (
    <AdminPage>
      <AdminPageHeader title={t.admin.titles.internships} subtitle={t.admin.subtitle.internships} icon={<FiBookOpen size={20} />} />
      <AdminToolbar>
        <FiSliders size={16} className="hidden shrink-0 text-[var(--color-text-muted)] sm:block" />
        <Input placeholder={t.admin.searchInternships} value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="min-w-[220px] flex-1" />
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
        {hasFilters && <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter(''); setPage(1) }}>{t.admin.filters.clear}</Button>}
      </AdminToolbar>
      {isLoading ? <AdminTableShell><TableSkeleton rows={8} /></AdminTableShell> : internships.length === 0 ? <AdminEmpty title={t.admin.states.emptyInternships} description={t.admin.states.emptyInternshipsHint} icon={<FiSearch size={20} />} /> : (
        <AdminTableShell>
          <table className="w-full">
            <AdminTableHead>
              <th className={adminTh}>{t.admin.titles.internships}</th>
              <th className={adminTh}>{t.admin.columns.organization}</th>
              <th className={`${adminTh} hidden md:table-cell`}>Details</th>
              <th className={adminTh}>{t.admin.columns.status}</th>
              <th className={`${adminTh} whitespace-nowrap`}>{t.admin.columns.date}</th>
              <th className={`${adminTh} text-right`}>{t.admin.columns.actions}</th>
            </AdminTableHead>
            <AdminTableBody>
              {internships.map(i => (
                <AdminTableRow key={i.internship_id}>
                  <td className={adminTd}>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{i.title}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{[i.location, i.internship_type, i.work_mode].filter(Boolean).join(' · ')}</p>
                  </td>
                  <td className={adminTd}>{i.organization?.name || '—'}</td>
                  <td className={`${adminTd} hidden md:table-cell`}>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--color-text-muted)]">
                      {i.duration && <span>{i.duration}</span>}
                      {i.stipend && <span>{i.stipend}</span>}
                      {i.application_count !== undefined && <span>{t.admin.applications}: {i.application_count}</span>}
                      {i.deadline && <span>{t.admin.deadline}: {formatDate(i.deadline)}</span>}
                    </div>
                  </td>
                  <td className={adminTd}><AdminToneChip tone={statusTone(i.status)}>{i.status?.replace(/_/g, ' ')}</AdminToneChip></td>
                  <td className={`${adminTd} whitespace-nowrap text-xs text-[var(--color-text-muted)]`}>{formatDate(i.created_at)}</td>
                  <td className={`${adminTd} text-right`}>
                    <div className="flex justify-end gap-1">
                      {i.status !== 'published' && <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ internshipId: i.internship_id, status: 'published' })} isLoading={updateStatus.isPending}>Publish</Button>}
                      {i.status !== 'closed' && <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ internshipId: i.internship_id, status: 'closed' })} isLoading={updateStatus.isPending}>Close</Button>}
                      <Button size="sm" variant="ghost" className="text-danger-500" onClick={() => { if (confirm(`${t.common.delete}?`)) deleteInternship.mutate(i.internship_id) }} isLoading={deleteInternship.isPending}>{t.common.delete}</Button>
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