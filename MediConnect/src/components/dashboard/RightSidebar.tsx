import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiMapPin, FiClock, FiTrendingUp, FiCalendar, FiBriefcase } from 'react-icons/fi'
import { getRelativeTime, formatNumber } from '@/utils'
import { extractList } from '@/lib/pagination'
import { connectionService } from '@/api/connectionService'
import { postService } from '@/api/postService'
import { eventService } from '@/api/eventService'
import { jobService } from '@/api/jobService'
import type { User, Post, Event, Job } from '@/types'
import Avatar from '@/components/ui/Avatar'
import Skeleton from '@/components/ui/Skeleton'
import Badge from '@/components/ui/Badge'
import FollowButton from '@/components/connections/FollowButton'

export default function RightSidebar() {
  const { data: suggestionsData, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['sidebar-suggestions'],
    queryFn: async () => {
      const res = await connectionService.getSuggestions(1, 3)
      return res.data
    },
  })

  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ['trending'],
    queryFn: async () => {
      const res = await postService.getTrending(1, 3)
      return res.data
    },
  })

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['upcoming-events-sidebar'],
    queryFn: async () => {
      const res = await eventService.getUpcoming(1, 2)
      return res.data
    },
  })

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['recommended-jobs-sidebar'],
    queryFn: async () => {
      const res = await jobService.getJobs(1, 2)
      return res.data
    },
  })

  const suggestions = extractList<User>(suggestionsData)
  const trendingPosts = extractList<Post>(trendingData)
  const upcomingEvents = extractList<Event>(eventsData)
  const recommendedJobs = extractList<Job>(jobsData)

  return (
    <div className="sticky top-20 space-y-4">
      {suggestionsLoading ? (
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
          <Skeleton className="h-4 w-32 mb-3" />
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : suggestions.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Suggested Connections</h3>
            <Link to="/connections" className="text-xs font-medium text-primary-500 hover:text-primary-600">View All</Link>
          </div>
          <div className="space-y-3">
            {suggestions.map((user: User) => (
              <div key={user._id} className="flex items-center gap-3">
                <Link to={`/profile/${user.username}`}>
                  <Avatar src={user.profilePhoto} name={user.fullName} size="md" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/profile/${user.username}`}>
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate hover:text-primary-500">
                      {user.fullName}
                    </p>
                  </Link>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">{user.headline || user.specialization || ''}</p>
                </div>
                <FollowButton userId={user._id} isFollowing={false} variant="outline" size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {trendingLoading ? (
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
          <Skeleton className="h-4 w-28 mb-3" />
          {[1, 2, 3].map(i => (
            <div key={i} className="py-2 space-y-1.5">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      ) : trendingPosts.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <FiTrendingUp size={14} className="text-primary-500" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Trending Posts</h3>
            </div>
            <Link to="/feed" className="text-xs font-medium text-primary-500 hover:text-primary-600">View All</Link>
          </div>
          <div className="space-y-3">
            {trendingPosts.map((post: Post) => {
              const postAuthor = (post.author ?? {}) as { fullName?: string; username?: string; profilePhoto?: string }
              return (
                <Link key={post._id} to={`/feed?post=${post._id}`} className="block">
                  <p className="text-sm text-[var(--color-text-primary)] line-clamp-2 hover:text-primary-500 transition-colors">
                    {post.content.slice(0, 100)}{post.content.length > 100 ? '...' : ''}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Avatar src={postAuthor.profilePhoto} name={postAuthor.fullName} size="xs" />
                    <span className="text-xs text-[var(--color-text-muted)]">{postAuthor.fullName}</span>
                    <span className="text-xs text-[var(--color-text-muted)]">· {formatNumber(post.likesCount)} likes</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {eventsLoading ? (
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
          <Skeleton className="h-4 w-36 mb-3" />
          {[1, 2].map(i => (
            <div key={i} className="py-2 space-y-1.5">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      ) : upcomingEvents.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <FiCalendar size={14} className="text-primary-500" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Upcoming Events</h3>
            </div>
            <Link to="/events" className="text-xs font-medium text-primary-500 hover:text-primary-600">View All</Link>
          </div>
          <div className="space-y-3">
            {upcomingEvents.map((event: Event) => (
              <Link key={event._id} to={`/events/${event._id}`} className="block rounded-lg p-2 hover:bg-[var(--color-bg-hover)] transition-colors -mx-2">
                <p className="text-sm font-medium text-[var(--color-text-primary)] hover:text-primary-500 line-clamp-1">
                  {event.title}
                </p>
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
        </div>
      )}

      {jobsLoading ? (
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
          <Skeleton className="h-4 w-32 mb-3" />
          {[1, 2].map(i => (
            <div key={i} className="py-2 space-y-1.5">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      ) : recommendedJobs.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <FiBriefcase size={14} className="text-primary-500" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Recommended Jobs</h3>
            </div>
            <Link to="/jobs" className="text-xs font-medium text-primary-500 hover:text-primary-600">View All</Link>
          </div>
          <div className="space-y-3">
            {recommendedJobs.map((job: Job) => (
              <Link key={job._id} to={`/jobs/${job._id}`} className="block rounded-lg p-2 hover:bg-[var(--color-bg-hover)] transition-colors -mx-2">
                <p className="text-sm font-medium text-[var(--color-text-primary)] hover:text-primary-500 line-clamp-1">
                  {job.title}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{job.organization.name}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                  {job.location && (
                    <span className="flex items-center gap-0.5"><FiMapPin size={10} />{job.location}</span>
                  )}
                  {job.isRemote && <Badge variant="info" size="sm">Remote</Badge>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
