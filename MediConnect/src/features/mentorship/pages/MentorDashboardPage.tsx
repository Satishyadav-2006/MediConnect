import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiUsers, FiCheckCircle, FiClock, FiMessageSquare, FiCalendar } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import { mentorService } from '@/api/mentorService'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import Avatar from '@/components/ui/Avatar'
import { formatDate } from '@/utils'

interface DashboardData {
  activeMentees: number
  completedSessions: number
  pendingRequests: number
  upcomingSessions: { _id: string; mentee: { fullName: string; profilePhoto?: string }; scheduledAt: string; topic: string }[]
  recentActivity: { _id: string; mentee: { fullName: string }; action: string; createdAt: string }[]
}

export default function MentorDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['mentorDashboard'],
    queryFn: () => mentorService.getMentorDashboard().then(r => r.data),
  })

  const dashboard = (data?.data || data) as DashboardData

  if (isLoading) {
    return (
      <motion.div {...pageTransition} className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </motion.div>
    )
  }

  const stats = [
    { label: 'Active Mentees', value: dashboard?.activeMentees || 0, icon: <FiUsers size={20} />, color: 'text-primary-500 bg-primary-50' },
    { label: 'Completed Sessions', value: dashboard?.completedSessions || 0, icon: <FiCheckCircle size={20} />, color: 'text-accent-500 bg-accent-50' },
    { label: 'Pending Requests', value: dashboard?.pendingRequests || 0, icon: <FiClock size={20} />, color: 'text-warning-500 bg-warning-50' },
  ]

  return (
    <motion.div {...pageTransition} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Mentor Dashboard</h1>
        <div className="flex gap-2">
          <Link to="/mentorship/requests">
            <Button variant="outline" size="sm" leftIcon={<FiClock size={14} />}>View Requests</Button>
          </Link>
          <Link to="/mentorship/mentees">
            <Button size="sm" leftIcon={<FiUsers size={14} />}>My Mentees</Button>
          </Link>
        </div>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={i} variants={staggerItem} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${stat.color}`}>{stat.icon}</div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stat.value}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Upcoming Sessions</h2>
            <Link to="/mentorship/requests" className="text-sm text-primary-500 hover:text-primary-600">View all</Link>
          </div>
          {dashboard?.upcomingSessions?.length > 0 ? (
            <div className="space-y-3">
              {dashboard.upcomingSessions.map(session => (
                <div key={session._id} className="flex items-center gap-3 rounded-lg p-3 bg-[var(--color-bg-tertiary)]">
                  <Avatar name={session.mentee?.fullName} src={session.mentee?.profilePhoto} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{session.mentee?.fullName}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] truncate">{session.topic}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                    <FiCalendar size={12} />
                    <span>{formatDate(session.scheduledAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)] py-8 text-center">No upcoming sessions</p>
          )}
        </div>

        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Recent Activity</h2>
          </div>
          {dashboard?.recentActivity?.length > 0 ? (
            <div className="space-y-3">
              {dashboard.recentActivity.map(activity => (
                <div key={activity._id} className="flex items-start gap-3 rounded-lg p-3 bg-[var(--color-bg-tertiary)]">
                  <div className="rounded-full bg-primary-50 p-1.5 mt-0.5">
                    <FiMessageSquare size={14} className="text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-text-primary)]">
                      <span className="font-medium">{activity.mentee?.fullName}</span> {activity.action}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{formatDate(activity.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)] py-8 text-center">No recent activity</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
