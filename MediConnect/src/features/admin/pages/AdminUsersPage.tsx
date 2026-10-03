import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiSearch, FiUsers, FiShield, FiSliders } from 'react-icons/fi'
import { extractList, getPagination } from '@/lib/pagination'
import { useI18n } from '@/config/i18n'
import { useAuth } from '@/contexts/AuthContext'
import { adminService } from '@/api/adminService'
import {
  useAdminDeleteUser,
  useAdminUpdateUser,
  useAdminUpdateUserRole,
} from '@/features/admin/hooks/useAdmin'
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
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Pagination from '@/components/ui/Pagination'
import TableSkeleton from '@/components/skeletons/TableSkeleton'
import { formatDate } from '@/utils'

interface AdminUserRow {
  _id: string
  user_id: string
  username: string
  fullName: string
  profile_photo: string | null
  email: string
  role: string
  account_status: string
  verification_status?: string
  created_at: string
  last_login?: string | null
}

const ALL_ROLES = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'laboratory', label: 'Laboratory' },
  { value: 'researcher', label: 'Researcher' },
  { value: 'professor', label: 'Professor' },
  { value: 'medical_student', label: 'Medical Student' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'organization_admin', label: 'Org Admin' },
]

export default function AdminUsersPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', page, search, statusFilter, roleFilter],
    queryFn: () => adminService.getUsers(page, 20, {
      search: search || undefined,
      status: statusFilter || undefined,
      role: roleFilter || undefined,
    }).then(r => r.data),
  })

  const updateStatusMutation = useAdminUpdateUser()
  const updateRoleMutation = useAdminUpdateUserRole()
  const deleteMutation = useAdminDeleteUser()

  const users = extractList<AdminUserRow>(data)
  const pagination = getPagination(data)
  const hasFilters = Boolean(search || statusFilter || roleFilter)

  return (
    <AdminPage>
      <AdminPageHeader
        title={t.admin.titles.users}
        subtitle={t.admin.subtitle.users}
        icon={<FiUsers size={20} />}
      >
        {pagination && (
          <span className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur-sm">
            {pagination.total} {t.admin.users.toLowerCase()}
          </span>
        )}
      </AdminPageHeader>

      <AdminToolbar>
        <FiSliders size={16} className="hidden shrink-0 text-[var(--color-text-muted)] sm:block" />
        <Input
          placeholder={t.admin.searchUsers}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="min-w-[200px] flex-1"
        />
        <Select
          options={[
            { value: '', label: `${t.admin.columns.status}: ${t.admin.filters.all}` },
            { value: 'active', label: 'Active' },
            { value: 'suspended', label: 'Suspended' },
            { value: 'pending_professional_verification', label: 'Pending Verification' },
            { value: 'deactivated', label: 'Deactivated' },
          ]}
          value={statusFilter}
          onChange={v => { setStatusFilter(v); setPage(1) }}
          placeholder={t.admin.columns.status}
        />
        <Select
          options={[
            { value: '', label: `${t.admin.columns.role}: ${t.admin.filters.all}` },
            ...ALL_ROLES.map(r => ({ value: r.value, label: r.label })),
          ]}
          value={roleFilter}
          onChange={v => { setRoleFilter(v); setPage(1) }}
          placeholder={t.admin.columns.role}
        />
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(''); setStatusFilter(''); setRoleFilter(''); setPage(1) }}
          >
            {t.admin.filters.clear}
          </Button>
        )}
      </AdminToolbar>

      {isLoading ? (
        <AdminTableShell><TableSkeleton rows={8} /></AdminTableShell>
      ) : users.length === 0 ? (
        <AdminEmpty
          title={hasFilters ? t.admin.filters.noResults : t.admin.states.emptyUsers}
          description={hasFilters ? undefined : t.admin.states.emptyUsersHint}
          icon={<FiSearch size={20} />}
        />
      ) : (
        <AdminTableShell>
          <table className="w-full">
            <AdminTableHead>
              <th className={adminTh}>{t.admin.columns.user}</th>
              <th className={adminTh}>{t.admin.columns.role}</th>
              <th className={adminTh}>{t.admin.columns.status}</th>
              <th className={adminTh}>{t.admin.columns.joined}</th>
              <th className={`${adminTh} text-right`}>{t.admin.columns.actions}</th>
            </AdminTableHead>
            <AdminTableBody>
              {users.map(user => {
                const accountTone = statusTone(user.account_status)
                const verifyTone = statusTone(user.verification_status)
                return (
                  <AdminTableRow key={user.user_id}>
                    <td className={adminTd}>
                      <Link to={`/profile/${user.username}`} className="flex items-center gap-3">
                        <Avatar src={user.profile_photo || undefined} name={user.fullName} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{user.fullName}</p>
                          <p className="truncate text-xs text-[var(--color-text-muted)]">{user.email}</p>
                          {user.last_login && (
                            <p className="truncate text-[11px] text-[var(--color-text-muted)]">
                              {t.admin.columns.lastLogin}: {formatDate(user.last_login)}
                            </p>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className={adminTd}>
                      {editingRole === user.user_id ? (
                        <div className="flex items-center gap-1">
                          <Select
                            options={ALL_ROLES}
                            value={selectedRole}
                            onChange={v => setSelectedRole(v)}
                            placeholder={t.admin.columns.role}
                          />
                          <Button
                            size="sm"
                            isLoading={updateRoleMutation.isPending}
                            disabled={!selectedRole}
                            onClick={() => {
                              updateRoleMutation.mutate(
                                { userId: user.user_id, role: selectedRole },
                                { onSuccess: () => setEditingRole(null) },
                              )
                            }}
                          >
                            {t.common.save}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingRole(null)}>
                            {t.common.cancel}
                          </Button>
                        </div>
                      ) : isSuperAdmin ? (
                        <button
                          type="button"
                          className="cursor-pointer capitalize text-[var(--color-text-secondary)] transition-colors hover:text-primary-500"
                          onClick={() => { setEditingRole(user.user_id); setSelectedRole(user.role || '') }}
                        >
                          <AdminToneChip tone={statusTone(user.role)}>{user.role?.replace(/_/g, ' ')}</AdminToneChip>
                        </button>
                      ) : (
                        <AdminToneChip tone={statusTone(user.role)}>{user.role?.replace(/_/g, ' ')}</AdminToneChip>
                      )}
                    </td>
                    <td className={adminTd}>
                      <div className="flex flex-col items-start gap-1">
                        <Badge variant={accountTone === 'success' ? 'success' : accountTone === 'danger' ? 'danger' : 'warning'} size="sm">
                          {user.account_status?.replace(/_/g, ' ')}
                        </Badge>
                        {user.verification_status && (
                          <Badge variant={verifyTone === 'success' ? 'success' : verifyTone === 'danger' ? 'danger' : 'warning'} size="sm">
                            <FiShield size={11} className="mr-1" />
                            {user.verification_status.replace(/_/g, ' ')}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className={`${adminTd} whitespace-nowrap text-xs text-[var(--color-text-muted)]`}>
                      {formatDate(user.created_at)}
                    </td>
                    <td className={`${adminTd} text-right`}>
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          isLoading={updateStatusMutation.isPending}
                          onClick={() => updateStatusMutation.mutate({ userId: user.user_id, status: user.account_status === 'active' ? 'suspended' : 'active' })}
                        >
                          {user.account_status === 'active' ? t.admin.suspendUser : t.admin.unsuspendUser}
                        </Button>
                        {user.verification_status === 'pending' && (
                          <Link to="/admin/verification">
                            <Button variant="outline" size="sm">
                              <FiShield size={13} className="mr-1" /> {t.admin.titles.verification}
                            </Button>
                          </Link>
                        )}
                        {isSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger-500"
                            isLoading={deleteMutation.isPending}
                            onClick={() => { if (confirm(`${t.common.delete} ${user.fullName}?`)) deleteMutation.mutate(user.user_id) }}
                          >
                            {t.common.delete}
                          </Button>
                        )}
                      </div>
                    </td>
                  </AdminTableRow>
                )
              })}
            </AdminTableBody>
          </table>
        </AdminTableShell>
      )}

      {pagination && pagination.totalPages > 1 && (
        <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
      )}
    </AdminPage>
  )
}