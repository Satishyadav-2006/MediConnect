import { Link } from 'react-router-dom'
import ActivityCard from '@/components/profile/ActivityCard'

interface DashboardActivity {
  type: 'post' | 'like' | 'comment' | 'connection' | 'job' | 'event' | 'certification' | 'follow' | 'share' | 'edit'
  description: string
  timestamp: string
  target?: { label: string; url: string }
}

interface RecentActivityProps {
  activities: DashboardActivity[]
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const displayedActivities = activities.slice(0, 5)

  return (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Recent Activity</h3>
        {activities.length > 5 && (
          <Link to="/activity" className="text-sm font-medium text-primary-500 hover:text-primary-600">
            View All
          </Link>
        )}
      </div>

      {displayedActivities.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)] py-4 text-center">No recent activity.</p>
      ) : (
        <div className="divide-y divide-[var(--color-border-primary)]">
          {displayedActivities.map((activity, i) => (
            <ActivityCard key={i} activity={activity} />
          ))}
        </div>
      )}
    </div>
  )
}
