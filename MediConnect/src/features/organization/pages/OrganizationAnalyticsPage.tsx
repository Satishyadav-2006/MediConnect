import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiTrendingUp, FiUsers, FiEye, FiBriefcase, FiMessageCircle } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '@/api/analyticsService'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import Skeleton from '@/components/ui/Skeleton'
import { formatNumber } from '@/utils'

interface AnalyticsData {
  followersGrowth?: { date: string; count: number }[]
  jobViews?: number
  postEngagement?: number
  eventRegistrations?: number
  employeeCount?: number
  totalFollowers?: number
  totalJobs?: number
  totalPosts?: number
}

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  trend?: number
  color: string
}

function StatCard({ label, value, icon, trend, color }: StatCardProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
      <div className="flex items-center justify-between">
        <div className={`rounded-lg p-2 ${color}`}>{icon}</div>
        {trend !== undefined && (
          <span className={`text-xs font-medium ${trend >= 0 ? 'text-accent-600' : 'text-danger-600'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">{typeof value === 'number' ? formatNumber(value) : value}</p>
      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{label}</p>
    </div>
  )
}

function MiniBarChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data || data.length === 0) return <div className="h-32 flex items-center justify-center text-xs text-[var(--color-text-muted)]">No data available</div>
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="flex items-end gap-1 h-32">
      {data.slice(-14).map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-primary-500 rounded-t-sm transition-all"
            style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? 2 : 0 }}
          />
          {i % 3 === 0 && (
            <span className="text-[8px] text-[var(--color-text-muted)] truncate w-full text-center">
              {new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export default function OrganizationAnalyticsPage() {
  const { id } = useParams<{ id: string }>()

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['organizationAnalytics', id],
    queryFn: () => analyticsService.getProfileAnalytics().then(r => r.data),
    enabled: !!id,
  })

  const analytics = (analyticsData?.data || analyticsData) as AnalyticsData | undefined

  if (isLoading) {
    return (
      <motion.div {...pageTransition} className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
              <Skeleton className="h-10 w-10 rounded-lg mb-3" />
              <Skeleton className="h-6 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </motion.div>
    )
  }

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Analytics</h2>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={staggerItem}>
          <StatCard
            label="Total Followers"
            value={analytics?.totalFollowers || 0}
            icon={<FiUsers size={20} className="text-blue-600" />}
            trend={analyticsData?.profileViewsTrend}
            color="bg-blue-50"
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            label="Job Views"
            value={analytics?.jobViews || 0}
            icon={<FiEye size={20} className="text-purple-600" />}
            trend={analyticsData?.postImpressionsTrend}
            color="bg-purple-50"
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            label="Post Engagement"
            value={analytics?.postEngagement || 0}
            icon={<FiMessageCircle size={20} className="text-green-600" />}
            color="bg-green-50"
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            label="Active Jobs"
            value={analytics?.totalJobs || 0}
            icon={<FiBriefcase size={20} className="text-orange-600" />}
            color="bg-orange-50"
          />
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={staggerItem} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Followers Growth</h3>
          <MiniBarChart data={analytics?.followersGrowth || []} />
        </motion.div>

        <motion.div variants={staggerItem} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Profile Views</h3>
          <MiniBarChart data={analyticsData?.viewsByDate || []} />
        </motion.div>
      </div>

      <motion.div variants={staggerItem} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Performance Overview</h3>
        <div className="space-y-3">
          {[
            { label: 'Post Impressions', value: analyticsData?.postImpressions || 0, max: 10000 },
            { label: 'Search Appearances', value: analyticsData?.searchAppearances || 0, max: 5000 },
            { label: 'Event Registrations', value: analytics?.eventRegistrations || 0, max: 1000 },
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mb-1">
                <span>{item.label}</span>
                <span>{formatNumber(item.value)}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--color-bg-tertiary)]">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all"
                  style={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
