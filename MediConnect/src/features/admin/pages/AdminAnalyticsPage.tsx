import { useState } from 'react'
import {
  FiUsers,
  FiFileText,
  FiBriefcase,
  FiCalendar,
  FiArrowUp,
  FiArrowDown,
  FiActivity,
} from 'react-icons/fi'
import { useAdminAnalytics } from '@/features/admin/hooks/useAdmin'
import { useI18n } from '@/config/i18n'
import { formatNumber, cn } from '@/utils'
import {
  AdminBarChart,
  AdminDistributionBar,
  AdminErrorState,
  AdminKeyValue,
  AdminLoadingCards,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminSegmentedControl,
  AdminStatCard,
  AdminStatGrid,
  type AdminTone,
} from '@/components/admin'

interface AdminAnalytics {
  period_days: number
  totals: {
    totalUsers: number
    totalPosts: number
    activeJobs: number
    activeInternships: number
    totalEvents: number
    upcomingEvents: number
    totalConnections: number
    activeMentorships: number
  }
  growth: {
    usersGrowth: number
    postsGrowth: number
    jobsGrowth: number
    eventsGrowth: number
  }
  userGrowthData: Array<{ date: string; label: string; count: number }>
  usersByRole: Array<{ role: string; count: number }>
  topLocations: Array<{ location: string; count: number }>
  topSpecializations: Array<{ name: string; count: number }>
  platformHealth: {
    dailyActiveUsers: number
    newSignups: number
    retentionRate: number
    avgSessionDuration: string
  }
}

const PERIODS = [
  { value: 'weekly', label: 'period7' },
  { value: 'monthly', label: 'period30' },
  { value: 'quarterly', label: 'period90' },
  { value: 'yearly', label: 'period365' },
] as const

export default function AdminAnalyticsPage() {
  const { t } = useI18n()
  const [period, setPeriod] = useState('monthly')

  const { data, isLoading, isError } = useAdminAnalytics(period)
  const analytics = data as AdminAnalytics | undefined

  if (isLoading) {
    return (
      <AdminPage>
        <AdminLoadingCards count={4} className="h-28" />
        <AdminLoadingCards count={2} className="h-64" />
      </AdminPage>
    )
  }

  if (isError || !analytics) {
    return (
      <AdminPage>
        <AdminErrorState
          title={t.admin.states.loadError}
          description={t.admin.states.loadErrorHint}
        />
      </AdminPage>
    )
  }

  const { totals, growth, userGrowthData, usersByRole, topLocations, topSpecializations, platformHealth } = analytics
  const newUsersTotal = userGrowthData.reduce((sum, g) => sum + g.count, 0)

  function TrendBadge({ trend }: { trend: number }) {
    const up = trend >= 0
    return (
      <span
        className={cn(
          'flex items-center gap-0.5 text-xs font-medium',
          up ? 'text-primary-600 dark:text-primary-400' : 'text-danger-500',
        )}
      >
        {up ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />}
        {Math.abs(trend)}%
      </span>
    )
  }

  function StatCard({
    icon,
    label,
    value,
    trend,
    tone,
  }: {
    icon: React.ReactNode
    label: string
    value: number
    trend: number
    tone: AdminTone
  }) {
    return (
      <AdminStatCard
        icon={icon}
        label={label}
        value={formatNumber(value)}
        tone={tone}
        hint={<TrendBadge trend={trend} />}
      />
    )
  }

  return (
    <AdminPage>
      <AdminPageHeader
        title={t.admin.titles.analytics}
        subtitle={t.admin.subtitle.analytics}
        icon={<FiActivity size={20} />}
      >
        <AdminSegmentedControl
          options={PERIODS.map(p => ({ value: p.value, label: t.admin[p.label] }))}
          value={period}
          onChange={setPeriod}
        />
      </AdminPageHeader>

      <AdminStatGrid columns={4}>
        <StatCard icon={<FiUsers size={20} />} label={t.admin.totalUsers} value={totals.totalUsers} trend={growth.usersGrowth} tone="primary" />
        <StatCard icon={<FiFileText size={20} />} label={t.admin.totalPosts} value={totals.totalPosts} trend={growth.postsGrowth} tone="info" />
        <StatCard icon={<FiBriefcase size={20} />} label={t.admin.activeJobs} value={totals.activeJobs} trend={growth.jobsGrowth} tone="accent" />
        <StatCard icon={<FiCalendar size={20} />} label={t.admin.totalEvents} value={totals.totalEvents} trend={growth.eventsGrowth} tone="success" />
      </AdminStatGrid>

      <AdminStatGrid columns={4}>
        <AdminStatCard label={t.admin.metrics.internships} value={formatNumber(totals.activeInternships)} tone="info" />
        <AdminStatCard label={t.admin.upcomingEvents} value={formatNumber(totals.upcomingEvents)} tone="warning" />
        <AdminStatCard label={t.admin.totalConnections} value={formatNumber(totals.totalConnections)} tone="accent" />
        <AdminStatCard label={t.admin.metrics.mentorships} value={formatNumber(totals.activeMentorships)} tone="success" />
      </AdminStatGrid>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AdminPanel className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{t.admin.userGrowth}</h3>
            <span className="text-xs text-[var(--color-text-muted)]">
              {formatNumber(newUsersTotal)} {t.admin.newUsers} · {analytics.period_days} {t.admin.days}
            </span>
          </div>
          <AdminBarChart
            data={userGrowthData.slice(-30).map(g => ({ label: g.label || g.date, value: g.count }))}
            emptyLabel={t.admin.states.noGrowth}
          />
        </AdminPanel>

        <AdminPanel className="p-5">
          <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">{t.admin.usersByRole}</h3>
          {usersByRole.length ? (
            <AdminDistributionBar
              items={usersByRole.map(r => ({ label: r.role, value: r.count }))}
              toneFor={() => 'primary'}
            />
          ) : (
            <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">{t.admin.noData}</p>
          )}
        </AdminPanel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AdminPanel className="p-5">
          <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">{t.admin.topLocations}</h3>
          {topLocations.length ? (
            <div className="space-y-2">
              {topLocations.slice(0, 6).map(loc => (
                <AdminKeyValue key={loc.location} label={loc.location} value={formatNumber(loc.count)} />
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">{t.admin.noData}</p>
          )}
        </AdminPanel>

        <AdminPanel className="p-5">
          <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">{t.admin.topSpecializations}</h3>
          {topSpecializations.length ? (
            <div className="space-y-2">
              {topSpecializations.slice(0, 6).map(spec => (
                <AdminKeyValue key={spec.name} label={spec.name} value={formatNumber(spec.count)} />
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">{t.admin.noData}</p>
          )}
        </AdminPanel>

        <AdminPanel className="p-5">
          <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">{t.admin.platformHealth}</h3>
          <div className="space-y-3">
            <AdminKeyValue label={t.admin.dailyActiveUsers} value={formatNumber(platformHealth.dailyActiveUsers)} />
            <AdminKeyValue label={t.admin.newSignups} value={formatNumber(platformHealth.newSignups)} />
            <AdminKeyValue label={t.admin.retentionRate} value={`${platformHealth.retentionRate}%`} />
            <AdminKeyValue label={t.admin.avgSessionDuration} value={platformHealth.avgSessionDuration} />
          </div>
        </AdminPanel>
      </div>
    </AdminPage>
  )
}