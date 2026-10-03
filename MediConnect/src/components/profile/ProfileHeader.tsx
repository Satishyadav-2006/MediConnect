import { Link } from 'react-router-dom'
import { FiMapPin, FiCalendar, FiEdit2 } from 'react-icons/fi'
import { formatFullDate, formatNumber } from '@/utils'
import type { User } from '@/types'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

interface ProfileHeaderProps {
  user: User
  isOwn?: boolean
  onConnect?: () => void
}

export default function ProfileHeader({ user, isOwn, onConnect }: ProfileHeaderProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]">
      <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-700 sm:h-40" />
      <div className="px-4 pb-4 sm:px-6">
        <div className="-mt-12 flex items-end justify-between sm:-mt-16">
          <Avatar src={user.profilePhoto} name={user.fullName} size="xl" className="border-4 border-[var(--color-bg-primary)]" />
          <div className="flex gap-2 pb-2">
            {isOwn ? (
              <Link to="/profile/edit">
                <Button variant="outline" size="sm" leftIcon={<FiEdit2 size={14} />}>Edit Profile</Button>
              </Link>
            ) : (
              <Button size="sm" onClick={onConnect}>Connect</Button>
            )}
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{user.fullName}</h1>
            {user.accountStatus === 'active' && <Badge variant="primary" dot>Verified</Badge>}
          </div>
          {user.headline && <p className="text-sm text-[var(--color-text-secondary)]">{user.headline}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)]">
            {user.specialization && <span>{user.specialization}</span>}
            {user.location && <span className="flex items-center gap-1"><FiMapPin size={12} />{user.location}</span>}
            <span className="flex items-center gap-1"><FiCalendar size={12} />Joined {formatFullDate(user.createdAt)}</span>
          </div>
          <div className="mt-3 flex gap-4 text-sm">
            <span><strong>{formatNumber(user.connectionsCount)}</strong> <span className="text-[var(--color-text-muted)]">connections</span></span>
            <span><strong>{formatNumber(user.followersCount)}</strong> <span className="text-[var(--color-text-muted)]">followers</span></span>
            <span><strong>{formatNumber(user.postsCount)}</strong> <span className="text-[var(--color-text-muted)]">posts</span></span>
          </div>
        </div>
      </div>
    </div>
  )
}
