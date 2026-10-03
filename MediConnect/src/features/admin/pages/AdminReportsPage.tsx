import { useState } from 'react'
import { FiAlertTriangle, FiSearch, FiSliders } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import { extractList, getPagination } from '@/lib/pagination'
import { adminService } from '@/api/adminService'
import { useAdminResolveReport } from '@/features/admin/hooks/useAdmin'
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
import Pagination from '@/components/ui/Pagination'
import TableSkeleton from '@/components/skeletons/TableSkeleton'

interface AdminReport {
  report_id: string
  reporter_id: string
  target_id: string
  target_type: string
  reason: string
  description?: string
  status: string
  created_at: string
}

const STATUS_TABS = [
  { value: 'pending', labelKey: 'pending' },
  { value: 'resolved', labelKey: 'resolved' },
  { value: 'dismissed', labelKey: 'dismissed' },
] as const

export default function AdminReportsPage() {
  const { t } = useI18n()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('pending')
  const resolveMutation = useAdminResolveReport()

  const { data, isLoading } = useQuery({
    queryKey: ['adminReports', page, statusFilter],
    queryFn: () => adminService.getReports(page, 20, statusFilter).then(r => r.data),
  })

  const reports = extractList<AdminReport>(data)
  const pagination = getPagination(data)
  const hasFilters = statusFilter !== 'pending'

  return (
    <AdminPage>
      <AdminPageHeader
        title={t.admin.titles.reports}
        subtitle={t.admin.subtitle.reports}
        icon={<FiAlertTriangle size={20} />}
      />
      <AdminToolbar>
        <FiSliders size={16} className="hidden shrink-0 text-[var(--color-text-muted)] sm:block" />
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map(tab => (
            <Button
              key={tab.value}
              variant={statusFilter === tab.value ? 'primary' : 'outline'}
              size="sm"
              onClick={() => { setStatusFilter(tab.value); setPage(1) }}
            >
              {t.admin[tab.labelKey]}
            </Button>
          ))}
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setStatusFilter('pending'); setPage(1) }}>
            {t.admin.filters.clear}
          </Button>
        )}
      </AdminToolbar>

      {isLoading ? (
        <AdminTableShell><TableSkeleton rows={8} /></AdminTableShell>
      ) : reports.length === 0 ? (
        <AdminEmpty title={t.admin.emptyReports} description={t.admin.emptyReportsHint} icon={<FiSearch size={20} />} />
      ) : (
        <AdminTableShell>
          <table className="w-full">
            <AdminTableHead>
              <th className={adminTh}>{t.admin.targetType}</th>
              <th className={adminTh}>{t.admin.reason}</th>
              <th className={`${adminTh} hidden lg:table-cell`}>{t.admin.description}</th>
              <th className={adminTh}>{t.admin.columns.status}</th>
              <th className={`${adminTh} whitespace-nowrap`}>{t.admin.columns.date}</th>
              <th className={`${adminTh} text-right`}>{t.admin.columns.actions}</th>
            </AdminTableHead>
            <AdminTableBody>
              {reports.map(report => (
                <AdminTableRow key={report.report_id}>
                  <td className={adminTd}>
                    <AdminToneChip tone={statusTone(report.target_type)}>{report.target_type}</AdminToneChip>
                  </td>
                  <td className={adminTd}>
                    <p className="max-w-[240px] truncate text-sm font-medium text-[var(--color-text-primary)]">{report.reason}</p>
                  </td>
                  <td className={`${adminTd} hidden lg:table-cell`}>
                    <p className="line-clamp-2 max-w-[320px] text-xs text-[var(--color-text-muted)]">{report.description}</p>
                  </td>
                  <td className={adminTd}><AdminToneChip tone={statusTone(report.status)}>{report.status}</AdminToneChip></td>
                  <td className={`${adminTd} whitespace-nowrap text-xs text-[var(--color-text-muted)]`}>{formatDate(report.created_at)}</td>
                  <td className={`${adminTd} text-right`}>
                    {report.status === 'pending' && (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" onClick={() => resolveMutation.mutate({ reportId: report.report_id, action: 'resolve' })} isLoading={resolveMutation.isPending}>
                          {t.admin.resolve}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => resolveMutation.mutate({ reportId: report.report_id, action: 'dismiss' })} isLoading={resolveMutation.isPending}>
                          {t.admin.dismiss}
                        </Button>
                      </div>
                    )}
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