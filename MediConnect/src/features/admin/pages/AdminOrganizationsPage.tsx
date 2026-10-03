import { useState } from 'react'
import { FiBriefcase, FiSearch, FiSliders } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import { extractList, getPagination } from '@/lib/pagination'
import { adminService } from '@/api/adminService'
import { useAdminDeleteOrganization, useAdminUpdateOrganization } from '@/features/admin/hooks/useAdmin'
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

interface AdminOrg {
  organization_id: string
  name: string
  organization_type?: string
  verification_status?: string
  account_status?: string
  created_at: string
}

export default function AdminOrganizationsPage() {
  const { t } = useI18n()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['adminOrganizations', page],
    queryFn: () => adminService.getOrganizations(page, 20).then(r => r.data),
  })

  const updateOrg = useAdminUpdateOrganization()
  const deleteOrg = useAdminDeleteOrganization()
  const orgs = extractList<AdminOrg>(data)
  const pagination = getPagination(data)
  const hasFilters = Boolean(search || statusFilter)

  return (
    <AdminPage>
      <AdminPageHeader title={t.admin.titles.organizations} subtitle={t.admin.subtitle.organizations} icon={<FiBriefcase size={20} />} />
      <AdminToolbar>
        <FiSliders size={16} className="hidden shrink-0 text-[var(--color-text-muted)] sm:block" />
        <Input placeholder={t.admin.searchOrganizations} value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="min-w-[220px] flex-1" />
        <Select
          options={[
            { value: '', label: `${t.admin.columns.status}: ${t.admin.filters.all}` },
            { value: 'approved', label: 'Approved' },
            { value: 'pending', label: 'Pending' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'suspended', label: 'Suspended' },
          ]}
          value={statusFilter}
          onChange={v => { setStatusFilter(v); setPage(1) }}
        />
        {hasFilters && <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter(''); setPage(1) }}>{t.admin.filters.clear}</Button>}
      </AdminToolbar>
      {isLoading ? <AdminTableShell><TableSkeleton rows={8} /></AdminTableShell> : orgs.length === 0 ? <AdminEmpty title={t.admin.states.emptyOrganizations} description={t.admin.states.emptyOrganizationsHint} icon={<FiSearch size={20} />} /> : (
        <AdminTableShell>
          <table className="w-full">
            <AdminTableHead>
              <th className={adminTh}>{t.admin.columns.organization}</th>
              <th className={adminTh}>{t.admin.columns.type}</th>
              <th className={adminTh}>{t.admin.columns.status}</th>
              <th className={`${adminTh} whitespace-nowrap`}>{t.admin.columns.date}</th>
              <th className={`${adminTh} text-right`}>{t.admin.columns.actions}</th>
            </AdminTableHead>
            <AdminTableBody>
              {orgs.map(o => (
                <AdminTableRow key={o.organization_id}>
                  <td className={adminTd}>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{o.name}</p>
                  </td>
                  <td className={adminTd}><AdminToneChip tone="info">{o.organization_type?.replace(/_/g, ' ')}</AdminToneChip></td>
                  <td className={adminTd}><AdminToneChip tone={statusTone(o.verification_status || o.account_status)}>{(o.verification_status || o.account_status || '').replace(/_/g, ' ')}</AdminToneChip></td>
                  <td className={`${adminTd} whitespace-nowrap text-xs text-[var(--color-text-muted)]`}>{formatDate(o.created_at)}</td>
                  <td className={`${adminTd} text-right`}>
                    <div className="flex justify-end gap-1">
                      {(o.verification_status || '').toLowerCase() !== 'approved' && <Button size="sm" variant="ghost" onClick={() => updateOrg.mutate({ orgId: o.organization_id, status: 'approved' })} isLoading={updateOrg.isPending}>Approve</Button>}
                      {(o.verification_status || '').toLowerCase() !== 'rejected' && <Button size="sm" variant="ghost" onClick={() => updateOrg.mutate({ orgId: o.organization_id, status: 'rejected' })} isLoading={updateOrg.isPending}>Reject</Button>}
                      <Button size="sm" variant="ghost" className="text-danger-500" onClick={() => { if (confirm(`${t.common.delete}?`)) deleteOrg.mutate(o.organization_id) }} isLoading={deleteOrg.isPending}>{t.common.delete}</Button>
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