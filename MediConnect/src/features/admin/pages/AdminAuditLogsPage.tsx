import { useState } from 'react'
import { FiSearch, FiSliders } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import { extractList, getPagination } from '@/lib/pagination'
import { adminService } from '@/api/adminService'
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
  adminTd,
  adminTh,
} from '@/components/admin'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Pagination from '@/components/ui/Pagination'
import TableSkeleton from '@/components/skeletons/TableSkeleton'

interface AuditLog {
  audit_id: string
  actor_id: string
  target_id?: string
  action: string
  resource?: string
  ip_address?: string
  timestamp: string
}

const ACTION_FILTERS = [
  { value: '', label: 'All' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'suspend', label: 'Suspend' },
  { value: 'verification_status_change', label: 'Verification change' },
]

export default function AdminAuditLogsPage() {
  const { t } = useI18n()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['adminAuditLogs', page],
    queryFn: () => adminService.getAuditLogs(page, 20).then(r => r.data),
  })

  const allLogs = extractList<AuditLog>(data)
  const logs = allLogs.filter(log => {
    if (actionFilter && log.action !== actionFilter) return false
    if (search) {
      const term = search.toLowerCase()
      return [log.action, log.resource, log.actor_id, log.target_id, log.ip_address]
        .some(field => field?.toLowerCase().includes(term))
    }
    return true
  })
  const pagination = getPagination(data)
  const hasFilters = Boolean(search || actionFilter)

  return (
    <AdminPage>
      <AdminPageHeader title={t.admin.titles.auditLogs} subtitle={t.admin.subtitle.auditLogs} icon={<FiSearch size={20} />} />
      <AdminToolbar>
        <FiSliders size={16} className="hidden shrink-0 text-[var(--color-text-muted)] sm:block" />
        <Input
          placeholder="Search action, actor, resource or IP..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="min-w-[240px] flex-1"
        />
        <Select options={ACTION_FILTERS} value={actionFilter} onChange={v => setActionFilter(v)} />
        {hasFilters && <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setActionFilter('') }}>{t.admin.filters.clear}</Button>}
      </AdminToolbar>
      {isLoading ? <AdminTableShell><TableSkeleton rows={8} /></AdminTableShell> : logs.length === 0 ? <AdminEmpty title={t.admin.states.emptyAuditLogs} description={t.admin.states.emptyAuditLogsHint} icon={<FiSearch size={20} />} /> : (
        <AdminTableShell>
          <table className="w-full">
            <AdminTableHead>
              <th className={adminTh}>{t.admin.columns.action}</th>
              <th className={`${adminTh} hidden md:table-cell`}>{t.admin.columns.resource}</th>
              <th className={adminTh}>{t.admin.columns.actor}</th>
              <th className={`${adminTh} hidden lg:table-cell`}>{t.admin.columns.target}</th>
              <th className={`${adminTh} hidden lg:table-cell`}>{t.admin.columns.ip}</th>
              <th className={`${adminTh} whitespace-nowrap`}>{t.admin.columns.date}</th>
            </AdminTableHead>
            <AdminTableBody>
              {logs.map(l => (
                <AdminTableRow key={l.audit_id}>
                  <td className={adminTd}><span className="font-medium capitalize text-[var(--color-text-primary)]">{l.action.replace(/_/g, ' ')}</span></td>
                  <td className={`${adminTd} hidden md:table-cell`}>{l.resource || '—'}</td>
                  <td className={adminTd}>{l.actor_id}</td>
                  <td className={`${adminTd} hidden lg:table-cell`}>{l.target_id || '—'}</td>
                  <td className={`${adminTd} hidden lg:table-cell`}>{l.ip_address || '—'}</td>
                  <td className={`${adminTd} whitespace-nowrap text-xs text-[var(--color-text-muted)]`}>{formatDate(l.timestamp)}</td>
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