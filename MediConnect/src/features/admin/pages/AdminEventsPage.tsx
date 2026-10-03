import { useState } from 'react'
import { FiCalendar, FiSearch, FiSliders } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import { extractList, getPagination } from '@/lib/pagination'
import { adminService } from '@/api/adminService'
import { useAdminDeleteEvent, useAdminUpdateEventStatus } from '@/features/admin/hooks/useAdmin'
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

interface AdminEvent {
  event_id: string
  title: string
  organizer?: { name?: string }
  location?: string
  event_mode?: string
  start_date?: string
  end_date?: string
  registration_count?: number
  capacity?: number
  status: string
  created_at: string
}

export default function AdminEventsPage() {
  const { t } = useI18n()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modeFilter, setModeFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['adminEvents', page, search, statusFilter, modeFilter],
    queryFn: () => adminService.getEvents({
      page,
      per_page: 20,
      search: search || undefined,
      event_status: statusFilter || undefined,
      event_mode: modeFilter || undefined,
    }).then(r => r.data),
  })

  const deleteEvent = useAdminDeleteEvent()
  const updateStatus = useAdminUpdateEventStatus()
  const events = extractList<AdminEvent>(data)
  const pagination = getPagination(data)
  const hasFilters = Boolean(search || statusFilter || modeFilter)

  return (
    <AdminPage>
      <AdminPageHeader title={t.admin.titles.events} subtitle={t.admin.subtitle.events} icon={<FiCalendar size={20} />} />
      <AdminToolbar>
        <FiSliders size={16} className="hidden shrink-0 text-[var(--color-text-muted)] sm:block" />
        <Input placeholder={t.admin.searchEvents} value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="min-w-[200px] flex-1" />
        <Select
          options={[
            { value: '', label: `${t.admin.columns.status}: ${t.admin.filters.all}` },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'ongoing', label: 'Ongoing' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
          value={statusFilter}
          onChange={v => { setStatusFilter(v); setPage(1) }}
        />
        <Select
          options={[
            { value: '', label: `Mode: ${t.admin.filters.all}` },
            { value: 'in-person', label: 'In-person' },
            { value: 'virtual', label: 'Virtual' },
            { value: 'hybrid', label: 'Hybrid' },
          ]}
          value={modeFilter}
          onChange={v => { setModeFilter(v); setPage(1) }}
        />
        {hasFilters && <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter(''); setModeFilter(''); setPage(1) }}>{t.admin.filters.clear}</Button>}
      </AdminToolbar>
      {isLoading ? <AdminTableShell><TableSkeleton rows={8} /></AdminTableShell> : events.length === 0 ? <AdminEmpty title={t.admin.states.emptyEvents} description={t.admin.states.emptyEventsHint} icon={<FiSearch size={20} />} /> : (
        <AdminTableShell>
          <table className="w-full">
            <AdminTableHead>
              <th className={adminTh}>{t.admin.titles.events}</th>
              <th className={adminTh}>{t.admin.columns.organization}</th>
              <th className={`${adminTh} hidden md:table-cell`}>Details</th>
              <th className={adminTh}>{t.admin.columns.status}</th>
              <th className={`${adminTh} whitespace-nowrap`}>{t.admin.columns.date}</th>
              <th className={`${adminTh} text-right`}>{t.admin.columns.actions}</th>
            </AdminTableHead>
            <AdminTableBody>
              {events.map(e => (
                <AdminTableRow key={e.event_id}>
                  <td className={adminTd}>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{e.title}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{[e.location, e.event_mode].filter(Boolean).join(' · ')}</p>
                  </td>
                  <td className={adminTd}>{e.organizer?.name || '—'}</td>
                  <td className={`${adminTd} hidden md:table-cell`}>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--color-text-muted)]">
                      {e.start_date && <span>{formatDate(e.start_date)}{e.end_date ? ` – ${formatDate(e.end_date)}` : ''}</span>}
                      {e.registration_count !== undefined && e.capacity !== undefined && <span>{e.registration_count}/{e.capacity}</span>}
                    </div>
                  </td>
                  <td className={adminTd}><AdminToneChip tone={statusTone(e.status)}>{e.status?.replace(/_/g, ' ')}</AdminToneChip></td>
                  <td className={`${adminTd} whitespace-nowrap text-xs text-[var(--color-text-muted)]`}>{formatDate(e.created_at)}</td>
                  <td className={`${adminTd} text-right`}>
                    <div className="flex justify-end gap-1">
                      {e.status !== 'scheduled' && e.status !== 'ongoing' && <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ eventId: e.event_id, status: 'scheduled' })} isLoading={updateStatus.isPending}>Schedule</Button>}
                      {e.status !== 'cancelled' && <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ eventId: e.event_id, status: 'cancelled' })} isLoading={updateStatus.isPending}>Cancel</Button>}
                      <Button size="sm" variant="ghost" className="text-danger-500" onClick={() => { if (confirm(`${t.common.delete}?`)) deleteEvent.mutate(e.event_id) }} isLoading={deleteEvent.isPending}>{t.common.delete}</Button>
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