import { motion } from 'framer-motion'
import {
  FiUsers, FiUserPlus, FiBriefcase, FiBookOpen, FiCalendar, FiThumbsUp, FiMessageCircle, FiFileText, FiInfo,
} from 'react-icons/fi'
import { useOrganization, useOrganizationJobs, useOrganizationInternships, useOrganizationEvents, useOrganizationPosts } from '@/features/organization/hooks/useOrganization'
import { useCurrentOrganizationContext } from '@/features/organization/context/CurrentOrganizationContext'
import { pageTransition } from '@/animations'
import StatCard from '@/components/ui/StatCard'
import { extractList, getPagination } from '@/lib/pagination'
import type { Job, Event, Internship, Post } from '@/types'

export default function OrgAnalyticsPage() {
  const { orgId, organization } = useCurrentOrganizationContext()
  const { data: orgData } = useOrganization(orgId || '')
  const { data: jobsData } = useOrganizationJobs(orgId || '')
  const { data: internshipsData } = useOrganizationInternships(orgId || '')
  const { data: eventsData } = useOrganizationEvents(orgId || '')
  const { data: postsData } = useOrganizationPosts(orgId || '')

  const org = (orgData?.data ?? orgData) as Record<string, unknown> | undefined
  const employeesCount = Number(org?.employeesCount ?? organization?.employee_count ?? 0)
  const followersCount = Number(org?.followersCount ?? organization?.followers_count ?? 0)

  const jobs = jobsData?.pages?.flatMap(p => extractList<Job>(p)) ?? []
  const totalJobs = getPagination(jobsData?.pages?.[0])?.total ?? jobs.length
  const activeJobs = jobs.filter(j => j.status === 'active').length
  const totalApplications = jobs.reduce((sum, j) => sum + (j.applicantsCount || 0), 0)

  const internships = internshipsData?.pages?.flatMap(p => extractList<Internship>(p)) ?? []
  const totalInternships = getPagination(internshipsData?.pages?.[0])?.total ?? internships.length
  const internshipApplications = internships.reduce((sum, i) => sum + (i.applicantsCount || 0), 0)

  const events = eventsData?.pages?.flatMap(p => extractList<Event>(p)) ?? []
  const totalEvents = getPagination(eventsData?.pages?.[0])?.total ?? events.length
  const upcomingEvents = events.filter(e => e.status === 'upcoming').length
  const totalAttendees = events.reduce((sum, e) => sum + (e.attendeesCount || 0), 0)

  const posts = postsData?.pages?.flatMap(p => extractList<Post>(p)) ?? []
  const totalPosts = getPagination(postsData?.pages?.[0])?.total ?? posts.length
  const totalLikes = posts.reduce((sum, p) => sum + (p.likesCount || 0), 0)
  const totalComments = posts.reduce((sum, p) => sum + (p.commentsCount || 0), 0)

  return (
    <motion.div {...pageTransition} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Organization Analytics</h2>
        <span className="rounded-full bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-500">Live</span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={<FiUsers size={20} />} label="Team Members" value={employeesCount} />
        <StatCard icon={<FiUserPlus size={20} />} label="Followers" value={followersCount} />
        <StatCard icon={<FiBriefcase size={20} />} label="Job Applications" value={totalApplications} />
        <StatCard icon={<FiBookOpen size={20} />} label="Internship Applications" value={internshipApplications} />
        <StatCard icon={<FiCalendar size={20} />} label="Event Attendees" value={totalAttendees} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={<FiBriefcase size={20} />} label="Total Jobs" value={totalJobs} />
        <StatCard icon={<FiBriefcase size={20} />} label="Active Jobs" value={activeJobs} />
        <StatCard icon={<FiBookOpen size={20} />} label="Internships" value={totalInternships} />
        <StatCard icon={<FiCalendar size={20} />} label="Events" value={totalEvents} />
        <StatCard icon={<FiCalendar size={20} />} label="Upcoming Events" value={upcomingEvents} />
        <StatCard icon={<FiFileText size={20} />} label="Posts" value={totalPosts} />
      </div>

      <section className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
        <h3 className="mb-1 text-base font-semibold text-[var(--color-text-primary)]">Post Engagement</h3>
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">Aggregated from the {totalPosts} posts currently visible in your organization feed.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard icon={<FiThumbsUp size={20} />} label="Total Likes" value={totalLikes} />
          <StatCard icon={<FiMessageCircle size={20} />} label="Total Comments" value={totalComments} />
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-xl border border-info-200 bg-info-50 p-4 text-sm text-info-700">
        <FiInfo size={18} className="mt-0.5 shrink-0" />
        <p>
          Advanced analytics such as post reach, follower demographics, and per-item performance are not yet available through
          the API. All numbers shown above are computed from real, live data (your organization profile, job/internship listings,
          organized events, and organization posts).
        </p>
      </div>
    </motion.div>
  )
}