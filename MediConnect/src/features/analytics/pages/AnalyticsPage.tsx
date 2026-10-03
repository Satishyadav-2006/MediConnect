import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiTrendingUp, FiEye, FiUsers, FiSearch, FiArrowUp, FiArrowDown } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '@/api/analyticsService'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import { Tabs, TabList, TabTrigger, TabContent } from '@/components/ui/Tabs'
import Skeleton from '@/components/ui/Skeleton'
import { cn, formatNumber } from '@/utils'
import type { Analytics } from '@/types'

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d')
  const { data, isLoading, isError } = useQuery({
    queryKey: ['profileAnalytics', period],
    queryFn: () => analyticsService.getProfileAnalytics(period).then(r => r.data),
  })

  const analytics = (data?.data || data) as Analytics | undefined

  if (isError) {
    return (
      <motion.div {...pageTransition} className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Something went wrong</h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Failed to load analytics.</p>
      </motion.div>
    )
  }

  const StatCard = ({ icon, label, value, trend, color }: { icon: React.ReactNode; label: string; value: number; trend: number; color: string }) => (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
      <div className="flex items-center justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', color)}>{icon}</div>
        <span className={cn('flex items-center gap-0.5 text-xs font-medium', trend >= 0 ? 'text-accent-500' : 'text-danger-500')}>
          {trend >= 0 ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />}
          {Math.abs(trend)}%
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">{formatNumber(value)}</p>
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
    </div>
  )

  return (
    <motion.div {...pageTransition} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Analytics</h1>
        <Tabs defaultValue="30d">
          <TabList>
            <TabTrigger value="7d" onClick={() => setPeriod('7d')}>7 Days</TabTrigger>
            <TabTrigger value="30d" onClick={() => setPeriod('30d')}>30 Days</TabTrigger>
            <TabTrigger value="90d" onClick={() => setPeriod('90d')}>90 Days</TabTrigger>
          </TabList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div variants={staggerItem}>
            <StatCard icon={<FiEye size={20} className="text-blue-500" />} label="Profile Views" value={analytics?.profileViews || 0} trend={analytics?.profileViewsTrend || 0} color="bg-blue-50" />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard icon={<FiTrendingUp size={20} className="text-primary-500" />} label="Post Impressions" value={analytics?.postImpressions || 0} trend={analytics?.postImpressionsTrend || 0} color="bg-primary-50" />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard icon={<FiSearch size={20} className="text-purple-500" />} label="Search Appearances" value={analytics?.searchAppearances || 0} trend={analytics?.searchAppearancesTrend || 0} color="bg-purple-50" />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard icon={<FiUsers size={20} className="text-accent-500" />} label="Connection Growth" value={analytics?.connectionGrowth || 0} trend={analytics?.connectionGrowthTrend || 0} color="bg-accent-50" />
          </motion.div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">Views Over Time</h3>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : analytics?.viewsByDate?.length ? (
            <div className="h-48 flex items-end gap-1">
              {analytics.viewsByDate.slice(-14).map((item, i) => {
                const maxCount = Math.max(...analytics.viewsByDate.map(v => v.count), 1)
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-primary-500 rounded-t transition-all hover:bg-primary-600"
                      style={{ height: `${(item.count / maxCount) * 100}%`, minHeight: item.count > 0 ? '4px' : '0' }}
                      title={`${item.date}: ${item.count} views`}
                    />
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-8">No data available yet</p>
          )}
        </div>

        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">Viewer Demographics</h3>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : analytics?.viewerDemographics?.length ? (
            <div className="space-y-3">
              {analytics.viewerDemographics.map((demo, i) => {
                const maxCount = Math.max(...analytics.viewerDemographics.map(d => d.count), 1)
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[var(--color-text-primary)]">{demo.location}</span>
                      <span className="text-[var(--color-text-muted)]">{demo.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-bg-tertiary)]">
                      <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${(demo.count / maxCount) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-8">No demographic data available</p>
          )}
        </div>
      </div>

      {analytics?.topPosts && analytics.topPosts.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">Top Performing Posts</h3>
          <div className="space-y-3">
            {analytics.topPosts.map(post => (
              <div key={post._id} className="flex items-start justify-between rounded-lg bg-[var(--color-bg-tertiary)] p-3">
                <p className="text-sm text-[var(--color-text-primary)] line-clamp-2 flex-1">{post.content}</p>
                <div className="flex items-center gap-3 ml-3 shrink-0 text-xs text-[var(--color-text-muted)]">
                  <span>{post.likesCount} likes</span>
                  <span>{post.commentsCount} comments</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
