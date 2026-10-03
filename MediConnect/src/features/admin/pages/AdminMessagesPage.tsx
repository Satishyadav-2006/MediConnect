import { useState } from 'react'
import { FiMail, FiSearch, FiSliders, FiEye, FiEyeOff } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import { extractList, getPagination } from '@/lib/pagination'
import { adminService } from '@/api/adminService'
import { useAdminDeleteMessage, useAdminSetMessageStatus } from '@/features/admin/hooks/useAdmin'
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
import Avatar from '@/components/ui/Avatar'
import Pagination from '@/components/ui/Pagination'
import TableSkeleton from '@/components/skeletons/TableSkeleton'
import Modal from '@/components/ui/Modal'

interface AdminMessage {
  message_id: string
  sender?: { user_id: string; fullName?: string; profile_photo?: string | null }
  conversation_id: string
  content: string
  message_type: string
  status: string
  created_at: string
}

export default function AdminMessagesPage() {
  const { t } = useI18n()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [reviewMessage, setReviewMessage] = useState<AdminMessage | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['adminMessages', page, search],
    queryFn: () => adminService.getMessages({ page, per_page: 20, search: search || undefined }).then(r => r.data),
  })

  const deleteMessage = useAdminDeleteMessage()
  const setStatus = useAdminSetMessageStatus()
  const messages = extractList<AdminMessage>(data)
  const pagination = getPagination(data)
  const hasFilters = Boolean(search)

  return (
    <AdminPage>
      <AdminPageHeader
        title={t.admin.titles.messages}
        subtitle={t.admin.subtitle.messages}
        icon={<FiMail size={20} />}
      />
      <AdminToolbar>
        <FiSliders size={16} className="hidden shrink-0 text-[var(--color-text-muted)] sm:block" />
        <Input
          placeholder={t.admin.searchMessages}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="min-w-[240px] flex-1"
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setPage(1) }}>
            {t.admin.filters.clear}
          </Button>
        )}
      </AdminToolbar>

      {isLoading ? (
        <AdminTableShell><TableSkeleton rows={8} /></AdminTableShell>
      ) : messages.length === 0 ? (
        <AdminEmpty title={t.admin.states.emptyMessages} description={t.admin.states.emptyMessagesHint} icon={<FiSearch size={20} />} />
      ) : (
        <AdminTableShell>
          <table className="w-full">
            <AdminTableHead>
              <th className={adminTh}>{t.admin.sender}</th>
              <th className={adminTh}>{t.admin.preview}</th>
              <th className={`${adminTh} whitespace-nowrap`}>{t.admin.columns.status}</th>
              <th className={`${adminTh} whitespace-nowrap`}>{t.admin.columns.date}</th>
              <th className={`${adminTh} text-right`}>{t.admin.columns.actions}</th>
            </AdminTableHead>
            <AdminTableBody>
              {messages.map(msg => (
                <AdminTableRow key={msg.message_id}>
                  <td className={adminTd}>
                    <div className="flex items-center gap-2">
                      <Avatar src={msg.sender?.profile_photo || undefined} name={msg.sender?.fullName || t.admin.unknownUser} size="sm" />
                      <span className="truncate text-sm font-medium text-[var(--color-text-primary)]">{msg.sender?.fullName || t.admin.unknownUser}</span>
                    </div>
                  </td>
                  <td className={adminTd}>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-[var(--color-text-primary)]">{truncateText(msg.content, 60) || '(empty)'}</p>
                      <p className="truncate text-xs text-[var(--color-text-muted)]">{msg.message_type} · {t.admin.conversation} {msg.conversation_id}</p>
                    </div>
                  </td>
                  <td className={adminTd}><AdminToneChip tone={statusTone(msg.status)}>{msg.status?.replace(/_/g, ' ')}</AdminToneChip></td>
                  <td className={`${adminTd} whitespace-nowrap text-xs text-[var(--color-text-muted)]`}>{formatDate(msg.created_at)}</td>
                  <td className={`${adminTd} text-right`}>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setReviewMessage(msg)}><FiEye size={14} className="mr-1" /> {t.admin.view}</Button>
                      {msg.status !== 'read' && (
                        <Button variant="ghost" size="sm" onClick={() => setStatus.mutate({ messageId: msg.message_id, status: 'read' })} isLoading={setStatus.isPending}>
                          <FiEye size={14} className="mr-1" /> Read
                        </Button>
                      )}
                      {msg.status !== 'hidden' && (
                        <Button variant="ghost" size="sm" onClick={() => setStatus.mutate({ messageId: msg.message_id, status: 'hidden' })} isLoading={setStatus.isPending}>
                          <FiEyeOff size={14} className="mr-1" /> {t.admin.hide}
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-danger-500" onClick={() => { if (confirm(t.admin.deleteContent || `${t.common.delete}?`)) deleteMessage.mutate(msg.message_id) }} isLoading={deleteMessage.isPending}>
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

      {reviewMessage && (
        <Modal isOpen={!!reviewMessage} onClose={() => setReviewMessage(null)}>
          <div className="p-6">
            <h2 className="mb-2 text-lg font-bold text-[var(--color-text-primary)]">{t.admin.message}</h2>
            <p className="mb-4 whitespace-pre-wrap text-sm text-[var(--color-text-secondary)]">{reviewMessage.content}</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setReviewMessage(null)}>{t.common.close}</Button>
              <Button variant="danger" onClick={() => { deleteMessage.mutate(reviewMessage.message_id); setReviewMessage(null) }} isLoading={deleteMessage.isPending}>{t.common.delete}</Button>
            </div>
          </div>
        </Modal>
      )}
    </AdminPage>
  )
}