import { useState } from 'react'
import { FiFileText, FiSearch, FiSliders } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import { extractList, getPagination } from '@/lib/pagination'
import { adminService } from '@/api/adminService'
import { useAdminDeletePost } from '@/features/admin/hooks/useAdmin'
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

interface ModerationPost {
  post_id: string
  content: string
  post_type: string
  status: string
  reaction_count: number
  comment_count: number
  share_count: number
  view_count: number
  created_at: string
  author?: { fullName?: string; profile_photo?: string | null; role?: string }
}

export default function AdminPostsPage() {
  const { t } = useI18n()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['adminPosts', page, status, search],
    queryFn: () => adminService.getPosts({ page, per_page: 20, post_status: status || undefined, search: search || undefined }).then(r => r.data),
  })

  const deletePost = useAdminDeletePost()
  const posts = extractList<ModerationPost>(data)
  const pagination = getPagination(data)
  const hasFilters = Boolean(search || status)

  return (
    <AdminPage>
      <AdminPageHeader
        title={t.admin.titles.posts}
        subtitle={t.admin.subtitle.posts}
        icon={<FiFileText size={20} />}
      />
      <AdminToolbar>
        <FiSliders size={16} className="hidden shrink-0 text-[var(--color-text-muted)] sm:block" />
        <Input
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1) }}
          placeholder={t.admin.searchPosts || 'Search post content...'}
          className="min-w-[220px] flex-1"
        />
        <Select
          options={[
            { value: '', label: `${t.admin.columns.status}: ${t.admin.filters.all}` },
            { value: 'active', label: 'Active' },
            { value: 'flagged', label: 'Flagged' },
            { value: 'hidden', label: 'Hidden' },
            { value: 'draft', label: 'Draft' },
          ]}
          value={status}
          onChange={v => { setStatus(v); setPage(1) }}
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatus(''); setPage(1) }}>
            {t.admin.filters.clear}
          </Button>
        )}
      </AdminToolbar>

      {isLoading ? (
        <AdminTableShell><TableSkeleton rows={8} /></AdminTableShell>
      ) : posts.length === 0 ? (
        <AdminEmpty title={t.admin.states.emptyPosts} description={t.admin.states.emptyPostsHint} icon={<FiSearch size={20} />} />
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
              {posts.map(post => (
                <AdminTableRow key={post.post_id}>
                  <td className={adminTd}>
                    <div className="flex items-start gap-3">
                      <Avatar src={post.author?.profile_photo || undefined} name={post.author?.fullName || t.admin.unknownUser} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{post.author?.fullName || t.admin.unknownUser}</p>
                        {post.content && (
                          <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-muted)]">{truncateText(post.content, 160)}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={adminTd}>
                    <AdminToneChip tone={statusTone(post.status)}>{post.status?.replace(/_/g, ' ')}</AdminToneChip>
                  </td>
                  <td className={`${adminTd} hidden md:table-cell`}>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--color-text-muted)]">
                      <span>{post.reaction_count} {t.admin.reactions}</span>
                      <span>{post.comment_count} {t.admin.comments}</span>
                      <span>{post.share_count} {t.admin.shares}</span>
                      <span>{post.view_count} {t.admin.views}</span>
                    </div>
                  </td>
                  <td className={`${adminTd} whitespace-nowrap text-xs text-[var(--color-text-muted)]`}>{formatDate(post.created_at)}</td>
                  <td className={`${adminTd} text-right`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger-500"
                      onClick={() => { if (confirm(t.admin.deletePost)) deletePost.mutate(post.post_id) }}
                      isLoading={deletePost.isPending}
                    >
                      {t.common.delete}
                    </Button>
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