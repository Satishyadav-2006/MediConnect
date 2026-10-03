import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiUsers, FiUserPlus, FiBriefcase, FiBookOpen, FiCalendar, FiFileText,
  FiChevronRight, FiArrowUpRight,
} from 'react-icons/fi'
import { useOrganization, useOrganizationJobs, useOrganizationInternships, useOrganizationEvents, useOrganizationPosts } from '@/features/organization/hooks/useOrganization'
import { useCurrentOrganizationContext } from '@/features/organization/context/CurrentOrganizationContext'
import { pageTransition } from '@/animations'
import StatCard from '@/components/ui/StatCard'
import JobCard from '@/components/jobs/JobCard'
import PostCard from '@/components/feed/PostCard'
import EventCard from '@/components/events/EventCard'
import { JobCardSkeleton, EventCardSkeleton, PostCardSkeleton } from '@/components/skeletons'
import { extractList, getPagination } from '@/lib/pagination'
import { ROUTES } from '@/constants/routes'
import type { Job, Event, Post } from '@/types'

const QUICK_ACTIONS = [
  { label: 'Post a Job', to: ROUTES.ORG_JOB_CREATE, icon: FiBriefcase },
  { label: 'Post Internship', to: ROUTES.ORG_INTERNSHIP_CREATE, icon: FiBookOpen },
  { label: 'Create Event', to: ROUTES.ORG_EVENT_CREATE, icon: FiCalendar },
  { label: 'Manage Posts', to: ROUTES.ORG_POSTS, icon: FiFileText },
]

export default function OrgDashboardPage() {
  const { orgId, organization } = useCurrentOrganizationContext()
  const { data: orgData } = useOrganization(orgId || '')
  const { data: jobsData, isLoading: jobsLoading } = useOrganizationJobs(orgId || '')
  const { data: internshipsData } = useOrganizationInternships(orgId || '')
  const { data: eventsData, isLoading: eventsLoading } = useOrganizationEvents(orgId || '')
  const { data: postsData, isLoading: postsLoading } = useOrganizationPosts(orgId || '')

  const org = (orgData?.data ?? orgData) as Record<string, unknown> | undefined
  const employeesCount = Number(org?.employeesCount ?? organization?.employee_count ?? 0)
  const followersCount = Number(org?.followersCount ?? organization?.followers_count ?? 0)

  const jobs = jobsData?.pages?.flatMap(p => extractList<Job>(p)) ?? []
  const activeJobs = jobs.filter(j => j.status === 'active').length
  const totalJobs = getPagination(jobsData?.pages?.[0])?.total ?? jobs.length
  const totalInternships = getPagination(internshipsData?.pages?.[0])?.total ?? 0
  const events = eventsData?.pages?.flatMap(p => extractList<Event>(p)) ?? []
  const upcomingEvents = events.filter(e => e.status === 'upcoming')
  const posts = postsData?.pages?.flatMap(p => extractList<Post>(p)) ?? []

  return (
    <motion.div {...pageTransition} className="space-y-6">
      <div className="rounded-xl border border-[var(--color-border-primary)] bg-gradient-to-br from-primary-500 to-primary-700 p-6 text-white">
        <h1 className="text-2xl font-bold">{organization?.name || 'Organization Dashboard'}</h1>
        <p className="mt-1 text-sm text-white/80">Welcome back to your organization workspace.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to={ROUTES.ORG_PROFILE} className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur-sm hover:bg-white/25 transition-colors">View Profile</Link>
          <Link to={ROUTES.ORG_POSTS} className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur-sm hover:bg-white/25 transition-colors">View Posts</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={<FiUsers size={20} />} label="Team Members" value={employeesCount} />
        <StatCard icon={<FiUserPlus size={20} />} label="Followers" value={followersCount} />
        <StatCard icon={<FiBriefcase size={20} />} label="Job Postings" value={totalJobs} />
        <StatCard icon={<FiBookOpen size={20} />} label="Internships" value={totalInternships} />
        <StatCard icon={<FiCalendar size={20} />} label="Events" value={events.length} />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {QUICK_ACTIONS.map(({ label, to, icon: Icon }) => (
          <Link key={to} to={to} className="group flex items-center justify-between gap-2 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-3 text-sm text-[var(--color-text-secondary)] hover:border-primary-500/40 hover:text-primary-500 transition-colors">
            <span className="flex items-center gap-2"><Icon size={16} /><span className="hidden sm:inline">{label}</span></span>
            <FiChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Recent Posts</h2>
            <Link to={ROUTES.ORG_POSTS} className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600">View all <FiArrowUpRight size={14} /></Link>
          </div>
          {postsLoading ? (
            <div className="space-y-2">{[1, 2].map(i => <PostCardSkeleton key={i} />)}</div>
          ) : posts.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">No posts yet. Write your first post to engage your audience.</p>
          ) : (
            <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
              {posts.slice(0, 5).map(post => <PostCard key={post._id} post={post} />)}
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Active Jobs</h2>
              <Link to={ROUTES.ORG_JOBS} className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600">View all <FiArrowUpRight size={14} /></Link>
            </div>
            {jobsLoading ? (
              <div className="grid grid-cols-1 gap-3">{[1, 2].map(i => <JobCardSkeleton key={i} />)}</div>
            ) : activeJobs === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">No active jobs right now.</p>
            ) : (
              <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                {jobs.filter(j => j.status === 'active').slice(0, 4).map(job => <JobCard key={job._id} job={job} href={`/org/jobs/${job._id}`} />)}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Upcoming Events</h2>
              <Link to={ROUTES.ORG_EVENTS} className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600">View all <FiArrowUpRight size={14} /></Link>
            </div>
            {eventsLoading ? (
              <div className="grid grid-cols-1 gap-3">{[1, 2].map(i => <EventCardSkeleton key={i} />)}</div>
            ) : upcomingEvents.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">No upcoming events scheduled.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {upcomingEvents.slice(0, 2).map(event => <EventCard key={event._id} event={event} href={`/org/events/${event._id}`} />)}
              </div>
            )}
          </section>
        </div>
      </div>
    </motion.div>
  )
}