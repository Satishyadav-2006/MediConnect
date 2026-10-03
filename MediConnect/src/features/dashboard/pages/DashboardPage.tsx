import { Link } from 'react-router-dom'
import { FiArrowRight, FiAward, FiCalendar, FiClock, FiMapPin, FiTrendingUp } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { useDashboardStats, useSuggestedConnections, useRecentNotifications, useRecommendedJobs } from '@/features/dashboard/hooks/useDashboard'
import { eventService } from '@/api/eventService'
import { postService } from '@/api/postService'
import { ROUTES } from '@/constants/routes'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import { DashboardSkeleton } from '@/components/skeletons'
import { Avatar, Badge } from '@/components/ui'
import WelcomeBanner from '@/components/dashboard/WelcomeBanner'
import QuickActions from '@/components/dashboard/QuickActions'
import RecentActivity from '@/components/dashboard/RecentActivity'
import ProfileCompletionCard from '@/components/profile/ProfileCompletionCard'
import FollowButton from '@/components/connections/FollowButton'
import { formatNumber, getRelativeTime } from '@/utils'
import { extractList } from '@/lib/pagination'
import type { User, Post, Event, Job } from '@/types'

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: suggestionsData, isLoading: suggestionsLoading } = useSuggestedConnections()
  const { data: notificationsData, isLoading: notificationsLoading } = useRecentNotifications()
  const { data: jobsData, isLoading: jobsLoading } = useRecommendedJobs()

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['upcoming-events-dashboard'],
    queryFn: () => eventService.getUpcoming(1, 2).then(r => r.data),
  })

  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ['trending-dashboard'],
    queryFn: () => postService.getTrending(1, 3).then(r => r.data),
  })

  const suggestions: User[] = extractList(suggestionsData)
  const upcomingEvents: Event[] = extractList(eventsData)
  const recommendedJobs: Job[] = extractList(jobsData)
  const trendingPosts: Post[] = extractList(trendingData)
  const recentNotifications = extractList<Record<string, unknown>>(notificationsData)

  const recentActivities = recentNotifications.slice(0, 5).map((n) => ({
    type: 'post' as const,
    description: (n.message || n.title || '') as string,
    timestamp: (n.createdAt || '') as string,
  }))

  const isLoading = statsLoading

  if (isLoading) return <DashboardSkeleton />

  return (
    <motion.div {...pageTransition} className="space-y-6">
      {user && <WelcomeBanner user={user} />}

      <QuickActions />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {user && user.isProfileComplete === false && <ProfileCompletionCard user={user} />}

          <RecentActivity activities={recentActivities} />

          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiTrendingUp size={18} className="text-primary-500" />
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Trending Feed</h3>
              </div>
              <Link to={ROUTES.FEED} className="text-sm font-medium text-primary-500 hover:text-primary-600 flex items-center gap-1">
                View All <FiArrowRight size={14} />
              </Link>
            </div>
            {trendingLoading ? (
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
                {[1, 2, 3].map(i => (
                  <motion.div key={i} variants={staggerItem} className="rounded-lg border border-[var(--color-border-primary)] p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--color-bg-tertiary)]" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-24 animate-pulse rounded bg-[var(--color-bg-tertiary)]" />
                        <div className="h-3 w-32 animate-pulse rounded bg-[var(--color-bg-tertiary)]" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-3 w-full animate-pulse rounded bg-[var(--color-bg-tertiary)]" />
                      <div className="h-3 w-3/4 animate-pulse rounded bg-[var(--color-bg-tertiary)]" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : trendingPosts.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">No trending posts yet</p>
            ) : (
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
                {trendingPosts.map((post: Post) => {
                  const author = (post.author ?? {}) as { fullName?: string; username?: string; profilePhoto?: string }
                  return (
                    <motion.div key={post._id} variants={staggerItem}>
                      <Link to={`/feed?post=${post._id}`} className="block rounded-lg p-3 hover:bg-[var(--color-bg-hover)] transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar src={author.profilePhoto} name={author.fullName} size="xs" />
                          <span className="text-xs font-medium text-[var(--color-text-primary)]">{author.fullName}</span>
                          <span className="text-xs text-[var(--color-text-muted)]">· {formatNumber(post.likesCount)} likes</span>
                        </div>
                        <p className="text-sm text-[var(--color-text-primary)] line-clamp-2">{post.content}</p>
                      </Link>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </div>
        </div>

        <div className="hidden lg:block space-y-4">
          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Suggested Connections</h3>
              <Link to={ROUTES.CONNECTIONS} className="text-xs font-medium text-primary-500 hover:text-primary-600">View All</Link>
            </div>
            {suggestionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--color-bg-tertiary)]" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-24 animate-pulse rounded bg-[var(--color-bg-tertiary)]" />
                      <div className="h-3 w-32 animate-pulse rounded bg-[var(--color-bg-tertiary)]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : suggestions.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] py-3 text-center">No suggestions yet</p>
            ) : (
              <div className="space-y-3">
                {suggestions.slice(0, 3).map((suggested: User) => (
                  <div key={suggested._id} className="flex items-center gap-3">
                    <Link to={`/profile/${suggested.username}`}>
                      <Avatar src={suggested.profilePhoto} name={suggested.fullName} size="md" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link to={`/profile/${suggested.username}`}>
                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate hover:text-primary-500">{suggested.fullName}</p>
                      </Link>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">{suggested.headline || suggested.specialization || ''}</p>
                    </div>
                    <FollowButton userId={suggested._id} isFollowing={false} variant="outline" size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <FiCalendar size={14} className="text-primary-500" />
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Upcoming Events</h3>
              </div>
              <Link to={ROUTES.EVENTS} className="text-xs font-medium text-primary-500 hover:text-primary-600">View All</Link>
            </div>
            {eventsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="space-y-1.5 py-2">
                    <div className="h-3.5 w-full animate-pulse rounded bg-[var(--color-bg-tertiary)]" />
                    <div className="h-3 w-24 animate-pulse rounded bg-[var(--color-bg-tertiary)]" />
                  </div>
                ))}
              </div>
            ) : upcomingEvents.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] py-3 text-center">No upcoming events</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event: Event) => (
                  <Link key={event._id} to={`/events/${event._id}`} className="block rounded-lg p-2 hover:bg-[var(--color-bg-hover)] transition-colors -mx-2">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] hover:text-primary-500 line-clamp-1">{event.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                      <FiClock size={10} />
                      <span>{getRelativeTime(event.startDate)}</span>
                      {event.mode && (
                        <>
                          <span>·</span>
                          <Badge variant="info" size="sm">{event.mode.replace('_', ' ')}</Badge>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Recommended Jobs</h3>
              <Link to={ROUTES.JOBS} className="text-xs font-medium text-primary-500 hover:text-primary-600">View All</Link>
            </div>
            {jobsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="space-y-1.5 py-2">
                    <div className="h-3.5 w-full animate-pulse rounded bg-[var(--color-bg-tertiary)]" />
                    <div className="h-3 w-24 animate-pulse rounded bg-[var(--color-bg-tertiary)]" />
                  </div>
                ))}
              </div>
            ) : recommendedJobs.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] py-3 text-center">No jobs to show yet</p>
            ) : (
              <div className="space-y-3">
                {recommendedJobs.map((job: Job) => (
                  <Link key={job._id} to={`/jobs/${job._id}`} className="block rounded-lg p-2 hover:bg-[var(--color-bg-hover)] transition-colors -mx-2">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] hover:text-primary-500 line-clamp-1">{job.title}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{job.organization.name}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                      {job.location && <span className="flex items-center gap-0.5"><FiMapPin size={10} />{job.location}</span>}
                      {job.isRemote && <Badge variant="info" size="sm">Remote</Badge>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <FiAward size={14} className="text-primary-500" />
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Achievements</h3>
              </div>
              <Link to={ROUTES.ACHIEVEMENTS} className="text-xs font-medium text-primary-500 hover:text-primary-600">View All</Link>
            </div>
            <div className="flex flex-col items-center py-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-500">
                <FiAward size={24} />
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">Complete challenges to earn achievements</p>
              <Link to={ROUTES.ACHIEVEMENTS} className="mt-2 text-xs font-medium text-primary-500 hover:text-primary-600">
                Explore Achievements
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
