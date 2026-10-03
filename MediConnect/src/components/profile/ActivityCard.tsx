import { Link } from 'react-router-dom'
import { FiHeart, FiMessageCircle, FiUserPlus, FiBriefcase, FiCalendar, FiAward, FiEdit2, FiShare2 } from 'react-icons/fi'
import { cn, getRelativeTime } from '@/utils'

interface Activity {
  type: 'post' | 'like' | 'comment' | 'connection' | 'job' | 'event' | 'certification' | 'follow' | 'share' | 'edit'
  description: string
  timestamp: string
  target?: { label: string; url: string }
}

interface ActivityCardProps {
  activity: Activity
}

const activityIconMap: Record<Activity['type'], { icon: typeof FiHeart; color: string }> = {
  post: { icon: FiMessageCircle, color: 'bg-blue-100 text-blue-600' },
  like: { icon: FiHeart, color: 'bg-red-100 text-red-600' },
  comment: { icon: FiMessageCircle, color: 'bg-green-100 text-green-600' },
  connection: { icon: FiUserPlus, color: 'bg-purple-100 text-purple-600' },
  job: { icon: FiBriefcase, color: 'bg-orange-100 text-orange-600' },
  event: { icon: FiCalendar, color: 'bg-cyan-100 text-cyan-600' },
  certification: { icon: FiAward, color: 'bg-yellow-100 text-yellow-600' },
  follow: { icon: FiUserPlus, color: 'bg-indigo-100 text-indigo-600' },
  share: { icon: FiShare2, color: 'bg-teal-100 text-teal-600' },
  edit: { icon: FiEdit2, color: 'bg-gray-100 text-gray-600' },
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const { icon: Icon, color } = activityIconMap[activity.type] || activityIconMap.post

  return (
    <div className="flex items-start gap-3 py-3">
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', color)}>
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[var(--color-text-primary)]">{activity.description}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">{getRelativeTime(activity.timestamp)}</span>
          {activity.target && (
            <>
              <span className="text-[var(--color-text-muted)]">·</span>
              <Link to={activity.target.url} className="text-xs text-primary-500 hover:text-primary-600 truncate">
                {activity.target.label}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
