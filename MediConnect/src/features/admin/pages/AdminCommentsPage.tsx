import { useState } from 'react'
import { FiMessageCircle, FiSearch, FiSliders, FiEyeOff, FiCheckCircle } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import { extractList, getPagination } from '@/lib/pagination'
import { adminService } from '@/api/adminService'
import { useAdminDeleteComment, useAdminSetCommentStatus } from '@/features/admin/hooks/useAdmin'
import { useI18n } from '@/config/i18n'
import { formatDate, truncateText } from '@/utils'
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
import Avatar from '@/components/ui/Avatar'
import Pagination from '@/components/ui/Pagination'
import TableSkeleton from '@/components/skeletons/TableSkeleton'

interface AdminComment {
  comment_id: string
  author?: { user_id: string; fullName?: string; profile_photo?: string | null }
  post_id: string
  postTitle?: string
  content: string
  status: string
  reaction_count: number
  reply_count: number
  created_at: string
}

export default function AdminCommentsPage() {
  const { t } = useI18n()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['adminComments', page, search, statusFilter],
    queryFn: () => adminService.getComments({
      page,
      per_page: 20,
      search: search || undefined,
      comment_status: statusFilter || undefined,
    }).then(r => r.data),
  })

  const deleteComment = useAdminDeleteComment()
  const setStatus = useAdminSetCommentStatus()
  const comments = extractList<AdminComment>(data)
  const pagination = getPagination(data)
  const hasFilters = Boolean(search || statusFilter)

  return (
    <AdminPage>
      <AdminPageHeader
        title={t.admin.titles.comments}
        subtitle={t.admin.subtitle.comments}
        icon={<FiMessageCircle size={20} />}
      />
      <AdminToolbar>
        <FiSliders size={16} className="hidden shrink-0 text-[var(--color-text-muted)] sm:block" />
        <Input
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1) }}
          placeholder={t.admin.searchComments}
          className="min-w-[220px] flex-1"
        />
        <Select
          options={[
            { value: '', label: `${t.admin.columns.status}: ${t.admin.filters.all}` },
            { value: 'active', label: 'Active' },
            { value: 'flagged', label: 'Flagged' },
            { value: 'hidden', label: 'Hidden' },
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
      ) : comments.length === 0 ? (
        <AdminEmpty title={t.admin.states.emptyComments} description={t.admin.states.emptyCommentsHint} icon={<FiSearch size={20} />} />
      ) : (
        <AdminTableShell>
          <table className="w-full">
            <AdminTableHead>
              <th className={adminTh}>{t.admin.columns.author}</th>
              <th className={adminTh}>{t.admin.columns.status}</th>
              <th className={`${adminTh} hidden md:table-cell`}>Engagement</th>
              <th className={`${adminTh} whitespace-nowrap`}>{t.admin.columns.date}</th>
              <th className={`${adminTh} text-right`}>{t.admin.columns.actions}</th>
            </AdminTableHead>
            <AdminTableBody>
              {comments.map(c => (
                <AdminTableRow key={c.comment_id}>
                  <td className={adminTd}>
                    <div className="flex items-start gap-3">
                      <Avatar src={c.author?.profile_photo || undefined} name={c.author?.fullName || t.admin.unknownUser} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{c.author?.fullName || t.admin.unknownUser}</p>
                        {c.postTitle && <p className="truncate text-xs text-[var(--color-text-muted)]">{t.admin.post}: {c.postTitle}</p>}
                        {c.content && <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-muted)]">{truncateText(c.content, 160)}</p>}
                      </div>
                    </div>
                  </td>
                  <td className={adminTd}><AdminToneChip tone={statusTone(c.status)}>{c.status?.replace(/_/g, ' ')}</AdminToneChip></td>
                  <td className={`${adminTd} hidden md:table-cell`}>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--color-text-muted)]">
                      <span>{c.reaction_count} {t.admin.reactions}</span>
                      <span>{c.reply_count} {t.admin.comments}</span>
                    </div>
                  </td>
                  <td className={`${adminTd} whitespace-nowrap text-xs text-[var(--color-text-muted)]`}>{formatDate(c.created_at)}</td>
                  <td className={`${adminTd} text-right`}>
                    <div className="flex justify-end gap-1">
                      {c.status !== 'active' && (
                        <Button variant="ghost" size="sm" onClick={() => setStatus.mutate({ commentId: c.comment_id, status: 'active' })} isLoading={setStatus.isPending}>
                          <FiCheckCircle size={14} className="mr-1" /> Active
                        </Button>
                      )}
                      {c.status !== 'hidden' && (
                        <Button variant="ghost" size="sm" onClick={() => setStatus.mutate({ commentId: c.comment_id, status: 'hidden' })} isLoading={setStatus.isPending}>
                          <FiEyeOff size={14} className="mr-1" /> Hide
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-danger-500" onClick={() => { if (confirm(t.admin.deleteComment)) deleteComment.mutate(c.comment_id) }} isLoading={deleteComment.isPending}>
                        {t.common.delete}
                      </Button>
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