import { FiUsers, FiGlobe, FiServer, FiShield } from 'react-icons/fi'
import {
  useAdminAuditLogs,
  useAdminGrowth,
  useAdminStats,
  useAdminSystemHealth,
} from '@/features/admin/hooks/useAdmin'
import { extractList } from '@/lib/pagination'
import { useI18n } from '@/config/i18n'
import { formatNumber, formatDate, cn } from '@/utils'
import {
  AdminBarChart,
  AdminEmpty,
  AdminErrorState,
  AdminKeyValue,
  AdminLoadingCards,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
  AdminStatGrid,
  type AdminTone,
} from '@/components/admin'

interface SystemHealth {
  status: string
  checks: Record<string, { status: string; error?: string }>
}

interface PlatformStats {
  total_users?: number
  verified_users?: number
  total_posts?: number
  total_jobs?: number
  total_internships?: number
  total_events?: number
}

interface GrowthPoint {
  date: string
  label?: string
  new_users: number
}

interface AuditLog {
  audit_id: string
  action: string
  resource?: string
  timestamp: string
}

const CHECK_LABELS: Record<string, string> = {
  database: 'Database',
  firebase: 'Auth (Firebase)',
  email: 'Email (SMTP)',
  storage: 'File Storage (Cloudinary)',
}

export default function AdminSystemPage() {
  const { t } = useI18n()
  const { data: health, isLoading: healthLoading, isError: healthError } = useAdminSystemHealth()
  const { data: stats, isLoading: statsLoading, isError: statsError } = useAdminStats()
  const { data: growth, isLoading: growthLoading, isError: growthError } = useAdminGrowth(14)
  const { data: logs, isLoading: logsLoading, isError: logsError } = useAdminAuditLogs(1, 6)

  const systemHealth = health as SystemHealth | undefined
  const platform = (stats || {}) as PlatformStats
  const growthPoints = (Array.isArray(growth?.growth) ? growth!.growth : []) as GrowthPoint[]
  const recentLogs = extractList<AuditLog>(logs)

  const isLoading = healthLoading || statsLoading
  const hasError = healthError || statsError

  const checkStatusClass = (status?: string) => {
    if (status === 'healthy' || status === 'configured') return 'bg-primary-500'
    if (status === 'not_configured') return 'bg-warning-500'
    return 'bg-danger-500'
  }

  const statusLabel = (s?: string) => {
    if (!s) return t.admin.unknown
    if (s === 'healthy') return t.admin.healthy
    if (s === 'not_configured') return t.admin.notConfigured
    if (s === 'configured') return t.admin.configured
    return s.replace(/_/g, ' ')
  }

  const _getTone = (status?: string): AdminTone => {
    if (status === 'healthy' || status === 'configured' || status === 'ok' || status === 'pass') return 'success'
    if (status === 'not_configured' || status === 'degraded' || status === 'warn') return 'warning'
    if (status === 'unhealthy' || status === 'down' || status === 'fail') return 'danger'
    return 'primary'
  }

  if (isLoading) {
    return (
      <AdminPage>
        <AdminLoadingCards count={4} className="h-28" />
        <AdminLoadingCards count={2} className="h-48" />
      </AdminPage>
    )
  }

  if (hasError || !systemHealth) {
    return (
      <AdminPage>
        <AdminErrorState title={t.admin.states.loadError} description={t.admin.states.loadErrorHint} />
      </AdminPage>
    )
  }

  return (
    <AdminPage>
      <AdminPageHeader
        title={t.admin.titles.system}
        subtitle={t.admin.subtitle.system}
        icon={<FiServer size={20} />}
      >
        <span
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium backdrop-blur-sm',
            systemHealth.status === 'healthy'
              ? 'bg-white/20 text-white'
              : 'bg-warning-500/90 text-white',
          )}
        >
          {statusLabel(systemHealth.status)}
        </span>
      </AdminPageHeader>

      <AdminStatGrid columns={4}>
        <AdminStatCard icon={<FiUsers size={20} />} label={t.admin.totalUsers} value={formatNumber(platform.total_users ?? 0)} tone="primary" />
        <AdminStatCard icon={<FiShield size={20} />} label={t.admin.metrics.verifiedUsers} value={formatNumber(platform.verified_users ?? 0)} tone="success" />
        <AdminStatCard icon={<FiServer size={20} />} label={t.admin.totalPosts} value={formatNumber(platform.total_posts ?? 0)} tone="info" />
        <AdminStatCard
          icon={<FiGlobe size={20} />}
          label={t.admin.listingsAndEvents}
          value={formatNumber((platform.total_jobs ?? 0) + (platform.total_internships ?? 0) + (platform.total_events ?? 0))}
          tone="accent"
        />
      </AdminStatGrid>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AdminPanel className="p-5">
          <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">{t.admin.serviceChecks}</h3>
          {Object.keys(systemHealth.checks || {}).length === 0 ? (
            <AdminEmpty title={t.admin.noChecks} icon={<FiShield size={20} />} />
          ) : (
            <div className="space-y-3">
              {Object.entries(systemHealth.checks).map(([key, check]) => (
                <div key={key} className="flex items-center justify-between rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] p-3">
                  <div className="flex items-center gap-3">
                    <span className={cn('h-2.5 w-2.5 rounded-full', checkStatusClass(check.status))} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{CHECK_LABELS[key] || key}</p>
                      {check.error && <p className="truncate text-xs text-danger-500">{check.error}</p>}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-medium capitalize text-[var(--color-text-muted)]">{statusLabel(check.status)}</span>
                </div>
              ))}
            </div>
          )}
        </AdminPanel>

        <AdminPanel className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{t.admin.userGrowth}</h3>
            {growth && <span className="text-xs text-[var(--color-text-muted)]">{t.admin.last} {growth.period_days ?? 14} {t.admin.days}</span>}
          </div>
          {growthLoading ? (
            <AdminLoadingCards count={1} className="h-40" />
          ) : growthError || growthPoints.length === 0 ? (
            <AdminEmpty title={t.admin.states.noGrowth} icon={<FiUsers size={20} />} />
          ) : (
            <AdminBarChart
              data={growthPoints.map(p => ({ label: p.label || p.date, value: p.new_users || 0 }))}
              emptyLabel={t.admin.states.noGrowth}
            />
          )}
        </AdminPanel>
      </div>

      <AdminPanel className="p-5">
        <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">{t.admin.recentSystemEvents}</h3>
        {logsLoading ? (
          <AdminLoadingCards count={3} className="h-12" />
        ) : logsError || recentLogs.length === 0 ? (
          <AdminEmpty title={t.admin.states.noActivity} icon={<FiShield size={20} />} />
        ) : (
          <div className="space-y-2">
            {recentLogs.map(log => (
              <div key={log.audit_id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-[var(--color-text-primary)]">
                    {log.action.replace(/_/g, ' ')}{log.resource ? ` · ${log.resource}` : ''}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">{formatDate(log.timestamp)}</p>
                </div>
                <AdminKeyValue label={t.admin.columns.action} value={<span className="capitalize">{log.action.replace(/_/g, ' ')}</span>} />
              </div>
            ))}
          </div>
        )}
      </AdminPanel>
    </AdminPage>
  )
}