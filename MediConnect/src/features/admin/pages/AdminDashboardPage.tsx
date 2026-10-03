import { extractList } from '@/lib/pagination'
import { useI18n } from '@/config/i18n'
import { Link } from 'react-router-dom'
import { FiUsers, FiBriefcase, FiFileText, FiCalendar, FiActivity, FiShield, FiAlertTriangle, FiBarChart2, FiBookOpen, FiAward } from 'react-icons/fi'
import {
  useAdminAuditLogs,
  useAdminDashboard,
  useAdminDeletePost,
  useAdminGrowth,
  useAdminPosts,
  useAdminReports,
  useAdminResolveReport,
  useAdminUpdateUser,
  useAdminUsers,
} from '@/features/admin/hooks/useAdmin'
import {
  AdminBarChart,
  AdminEmpty,
  AdminErrorState,
  AdminHeaderAction,
  AdminLoadingCards,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
  AdminStatGrid,
  AdminStatItem,
  AdminTableBody,
  AdminTableHead,
  AdminTableRow,
  AdminTableShell,
  AdminToneChip,
  AdminToolbar,
  AdminQuickAction,
  adminTd,
  adminTh,
  statusTone,
  toneClasses,
  type AdminTone,
} from '@/components/admin'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import TableSkeleton from '@/components/skeletons/TableSkeleton'
import { formatNumber, formatDate, truncateText } from '@/utils'

interface PlatformStats {
  total_users?: number
  verified_users?: number
  unverified_users?: number
  total_posts?: number
  total_jobs?: number
  total_internships?: number
  total_events?: number
  total_mentorships?: number
  pending_reports?: number
  pending_verifications?: number
  pending_organizations?: number
}

export default function AdminDashboardPage() {
  const { t } = useI18n()
  const { data, isLoading, isError } = useAdminDashboard()
  const stats: PlatformStats = data || {}

  if (isError) {
    return (
      <AdminPage>
        <AdminPageHeader title={t.admin.dashboard} icon={<FiShield size={20} />} subtitle={t.admin.subtitle.dashboard} />
        <AdminErrorState title={t.admin.states.loadError} description={t.admin.states.loadErrorHint} />
      </AdminPage>
    )
  }

  const queues: { to: string; title: string; count: number; tone: AdminTone }[] = [
    { to: '/admin/verification', title: t.admin.pendingVerifications, count: stats.pending_verifications ?? 0, tone: 'warning' },
    { to: '/admin/reports', title: t.admin.reportedContent, count: stats.pending_reports ?? 0, tone: 'danger' },
    { to: '/admin/organizations', title: t.admin.titles.organizations, count: stats.pending_organizations ?? 0, tone: 'info' },
  ]

  return (
    <AdminPage>
      <AdminPageHeader
        title={t.admin.dashboard}
        subtitle={t.admin.subtitle.dashboard}
        icon={<FiShield size={20} />}
      >
        <Link to="/admin/analytics">
          <AdminHeaderAction>
            <FiBarChart2 size={14} /> {t.admin.analytics}
          </AdminHeaderAction>
        </Link>
        <Link to="/admin/system">
          <AdminHeaderAction>
            <FiActivity size={14} /> {t.admin.systemHealth}
          </AdminHeaderAction>
        </Link>
      </AdminPageHeader>

      {isLoading ? (
        <AdminLoadingCards count={4} />
      ) : (
        <AdminStatGrid columns={4}>
          <AdminStatItem>
            <AdminStatCard
              icon={<FiUsers size={20} />}
              label={t.admin.totalUsers}
              value={formatNumber(stats.total_users ?? 0)}
              tone="primary"
              onClick={() => undefined}
            />
          </AdminStatItem>
          <AdminStatItem>
            <AdminStatCard icon={<FiBriefcase size={20} />} label={t.admin.activeJobs} value={formatNumber(stats.total_jobs ?? 0)} tone="accent" />
          </AdminStatItem>
          <AdminStatItem>
            <AdminStatCard icon={<FiFileText size={20} />} label={t.admin.totalPosts} value={formatNumber(stats.total_posts ?? 0)} tone="info" />
          </AdminStatItem>
          <AdminStatItem>
            <AdminStatCard icon={<FiCalendar size={20} />} label={t.admin.upcomingEvents} value={formatNumber(stats.total_events ?? 0)} tone="success" />
          </AdminStatItem>
        </AdminStatGrid>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t.admin.metrics.internships, value: stats.total_internships ?? 0, icon: <FiBookOpen size={16} /> },
          { label: t.admin.metrics.mentorships, value: stats.total_mentorships ?? 0, icon: <FiAward size={16} /> },
          { label: t.admin.metrics.verifiedUsers, value: stats.verified_users ?? 0, icon: <FiShield size={16} /> },
          { label: t.admin.metrics.unverifiedUsers, value: stats.unverified_users ?? 0, icon: <FiAlertTriangle size={16} /> },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-3 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4 transition-shadow hover:shadow-md">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400">
              {item.icon}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-[var(--color-text-primary)]">{formatNumber(item.value)}</p>
              <p className="truncate text-xs text-[var(--color-text-muted)]">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      <AdminToolbar>
        {[
          { label: t.admin.userManagement, to: '/admin/users', icon: <FiUsers size={16} /> },
          { label: t.admin.titles.verification, to: '/admin/verification', icon: <FiShield size={16} />, badge: stats.pending_verifications ?? 0 },
          { label: t.admin.contentModeration, to: '/admin/posts', icon: <FiFileText size={16} /> },
          { label: t.admin.reports, to: '/admin/reports', icon: <FiAlertTriangle size={16} />, badge: stats.pending_reports ?? 0 },
        ].map(a => (
          <div key={a.to} className="flex-1 basis-40">
            <AdminQuickAction label={a.label} to={a.to} icon={a.icon} badge={a.badge} />
          </div>
        ))}
      </AdminToolbar>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentActivityCard />

        <AdminPanel
          title={t.admin.pendingActions}
          icon={<FiAlertTriangle size={16} />}
          description={`${queues.reduce((s, q) => s + q.count, 0)} ${t.admin.metrics.pending}`}
        >
          <div className="space-y-3">
            {queues.map(q => (
              <Link
                key={q.to}
                to={q.to}
                className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors ${toneClasses.border[q.tone]}`}
              >
                <div className="min-w-0">
                  <p className={`truncate text-sm font-semibold ${toneClasses.text[q.tone]}`}>{q.title}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    <span className="font-semibold">{q.count}</span> {t.admin.metrics.pending}
                  </p>
                </div>
                <span className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${toneClasses.chip[q.tone]}`}>
                  {t.admin.metrics.review}
                </span>
              </Link>
            ))}
          </div>
        </AdminPanel>
      </div>

      <UserGrowthChart />
    </AdminPage>
  )
}

function RecentActivityCard() {
  const { t } = useI18n()
  const { data, isLoading } = useAdminAuditLogs(1, 8)
  const logs = extractList<{ audit_id: string; action: string; resource?: string; actor_id?: string; timestamp: string }>(data)

  return (
    <AdminPanel
      title={t.admin.recentActivity}
      icon={<FiActivity size={16} />}
      action={
        <Link to="/admin/audit-logs" className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600">
          {t.admin.metrics.viewAll}
        </Link>
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--color-bg-tertiary)]" />
          ))}
        </div>
      ) : logs.length > 0 ? (
        <div className="space-y-2">
          {logs.map(log => {
            const tone = log.action.includes('delete') || log.action.includes('suspend') ? 'danger' : 'primary'
            return (
              <div key={log.audit_id} className="flex items-center gap-3 rounded-lg bg-[var(--color-bg-tertiary)] p-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${toneClasses.chip[tone]}`}>
                  {log.action?.[0]?.toUpperCase() || 'A'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-[var(--color-text-primary)]">
                    {log.action?.replace(/_/g, ' ') || 'action'}
                    {log.resource ? ` · ${log.resource.replace(/_/g, ' ')}` : ''}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">{formatDate(log.timestamp)}</p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">{t.admin.states.noActivity}</p>
      )}
    </AdminPanel>
  )
}

function UserGrowthChart() {
  const { t } = useI18n()
  const { data, isLoading } = useAdminGrowth(30)
  const growth: { date: string; new_users: number }[] = Array.isArray(data?.growth) ? data.growth : []
  const shown = growth.slice(-14)
  const total = growth.reduce((sum, g) => sum + (g.new_users || 0), 0)

  return (
    <AdminPanel title={t.admin.userGrowth} icon={<FiBarChart2 size={16} />} description={t.admin.metrics.growthVs}>
      {isLoading ? (
        <div className="h-48 animate-pulse rounded-lg bg-[var(--color-bg-tertiary)]" />
      ) : (
        <>
          <AdminBarChart
            data={shown.map(g => ({ label: g.date.slice(5), value: g.new_users || 0 }))}
            emptyLabel={t.admin.states.noGrowth}
          />
          <p className="mt-4 text-xs text-[var(--color-text-muted)]">
            <span className="font-semibold text-[var(--color-text-primary)]">{total}</span>{' '}
            {t.admin.metrics.newUsers.replace('{days}', String(data?.period_days ?? 30))}
          </p>
        </>
      )}
    </AdminPanel>
  )
}

interface AdminUserRow {
  _id: string
  user_id: string
  username: string
  fullName: string
  profile_photo: string | null
  email: string
  role: string
  account_status: string
  created_at: string
}

export function UsersTab() {
  const { t } = useI18n()
  const { data, isLoading } = useAdminUsers()
  const updateStatus = useAdminUpdateUser()
  const users = extractList<AdminUserRow>(data)

  if (!isLoading && users.length === 0) {
    return <AdminEmpty title={t.admin.states.emptyUsers} description={t.admin.states.emptyUsersHint} icon={<FiUsers size={20} />} />
  }

  return (
    <AdminTableShell>
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : (
        <table className="w-full">
          <AdminTableHead>
            <th className={adminTh}>{t.admin.columns.user}</th>
            <th className={adminTh}>{t.admin.columns.role}</th>
            <th className={adminTh}>{t.admin.columns.status}</th>
            <th className={adminTh}>{t.admin.columns.joined}</th>
            <th className={`${adminTh} text-right`}>{t.admin.columns.actions}</th>
          </AdminTableHead>
          <AdminTableBody>
            {users.map(user => (
              <AdminTableRow key={user.user_id}>
                <td className={adminTd}>
                  <Link to={`/profile/${user.username}`} className="flex items-center gap-3">
                    <Avatar src={user.profile_photo || undefined} name={user.fullName} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{user.fullName}</p>
                      <p className="truncate text-xs text-[var(--color-text-muted)]">{user.email}</p>
                    </div>
                  </Link>
                </td>
                <td className={adminTd}>
                  <AdminToneChip tone={statusTone(user.role)}>{user.role?.replace(/_/g, ' ')}</AdminToneChip>
                </td>
                <td className={adminTd}>
                  <Badge variant={statusTone(user.account_status) === 'success' ? 'success' : statusTone(user.account_status) === 'danger' ? 'danger' : 'warning'} size="sm">
                    {user.account_status?.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className={`${adminTd} text-xs text-[var(--color-text-muted)]`}>{formatDate(user.created_at)}</td>
                <td className={`${adminTd} text-right`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    isLoading={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ userId: user.user_id, status: user.account_status === 'active' ? 'suspended' : 'active' })}
                  >
                    {user.account_status === 'active' ? t.admin.suspendUser : t.admin.unsuspendUser}
                  </Button>
                </td>
              </AdminTableRow>
            ))}
          </AdminTableBody>
        </table>
      )}
    </AdminTableShell>
  )
}

interface ModerationPost {
  post_id: string
  content: string
  status: string
  reaction_count: number
  comment_count: number
  view_count: number
  created_at: string
  author?: { fullName?: string; profile_photo?: string | null }
}

export function PostsTab() {
  const { t } = useI18n()
  const { data, isLoading } = useAdminPosts()
  const deleteMutation = useAdminDeletePost()
  const posts = extractList<ModerationPost>(data)

  if (!isLoading && posts.length === 0) {
    return <AdminEmpty title={t.admin.states.emptyPosts} description={t.admin.states.emptyPostsHint} icon={<FiFileText size={20} />} />
  }

  return (
    <AdminTableShell>
      {isLoading ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-[var(--color-bg-tertiary)]" />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-border-primary)]">
          {posts.map(post => (
            <div key={post.post_id} className="flex items-start justify-between gap-3 p-4 transition-colors hover:bg-[var(--color-bg-hover)]">
              <div className="flex min-w-0 items-start gap-3">
                <Avatar src={post.author?.profile_photo || undefined} name={post.author?.fullName || 'User'} size="sm" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{post.author?.fullName || 'Unknown user'}</p>
                    <AdminToneChip tone={statusTone(post.status)}>{post.status?.replace(/_/g, ' ')}</AdminToneChip>
                    <span className="text-xs text-[var(--color-text-muted)]">{formatDate(post.created_at)}</span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{truncateText(post.content, 150)}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)]">
                    <span>{post.reaction_count} reactions</span>
                    <span>{post.comment_count} comments</span>
                    <span>{post.view_count} views</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-danger-500"
                onClick={() => { if (confirm('Delete this post?')) deleteMutation.mutate(post.post_id) }}
                isLoading={deleteMutation.isPending}
              >
                {t.admin.deleteContent}
              </Button>
            </div>
          ))}
        </div>
      )}
    </AdminTableShell>
  )
}

interface AdminReportRow {
  report_id: string
  reason: string
  description?: string
  status: string
  target_type: string
  reporter_id: string
  created_at: string
}

export function ReportsTab() {
  const { t } = useI18n()
  const { data, isLoading } = useAdminReports('pending')
  const resolveMutation = useAdminResolveReport()
  const reports = extractList<AdminReportRow>(data)

  if (!isLoading && reports.length === 0) {
    return <AdminEmpty title={t.admin.states.emptyReports} description={t.admin.states.emptyReportsHint} icon={<FiAlertTriangle size={20} />} />
  }

  return (
    <AdminTableShell>
      {isLoading ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-[var(--color-bg-tertiary)]" />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-border-primary)]">
          {reports.map(report => (
            <div key={report.report_id} className="p-4 transition-colors hover:bg-[var(--color-bg-hover)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <AdminToneChip tone={statusTone(report.target_type)}>{report.target_type}</AdminToneChip>
                    <Badge variant={statusTone(report.status) === 'success' ? 'success' : 'warning'} size="sm">{report.status}</Badge>
                  </div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{report.reason}</p>
                  {report.description && <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{report.description}</p>}
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Reported by {report.reporter_id} · {formatDate(report.created_at)}
                  </p>
                </div>
                {report.status !== 'resolved' && (
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" isLoading={resolveMutation.isPending} onClick={() => resolveMutation.mutate({ reportId: report.report_id, action: 'dismiss' })}>
                      {t.admin.dismissReport}
                    </Button>
                    <Button variant="danger" size="sm" isLoading={resolveMutation.isPending} onClick={() => resolveMutation.mutate({ reportId: report.report_id, action: 'remove_content' })}>
                      {t.admin.banContent}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminTableShell>
  )
}