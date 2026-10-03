import { Link } from 'react-router-dom'
import { FiStar } from 'react-icons/fi'
import type { Mentor } from '@/types'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

interface MentorCardProps { mentor: Mentor; onRequest?: (id: string) => void }

export default function MentorCard({ mentor, onRequest }: MentorCardProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <Avatar src={mentor.user.profilePhoto} name={mentor.user.fullName} size="lg" />
        <div className="flex-1">
          <Link to={`/mentors/${mentor._id}`}>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-primary-500">{mentor.user.fullName}</h3>
          </Link>
          <p className="text-xs text-[var(--color-text-secondary)]">{mentor.user.specialization || mentor.user.headline}</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-warning-500">
            <FiStar size={12} fill="currentColor" />
            <span>{mentor.rating.toFixed(1)}</span>
            <span className="text-[var(--color-text-muted)]">({mentor.reviewsCount})</span>
          </div>
        </div>
        {mentor.isAvailable ? <Badge variant="success" dot>Available</Badge> : <Badge variant="default">Full</Badge>}
      </div>
      <p className="mt-3 text-xs text-[var(--color-text-secondary)] line-clamp-2">{mentor.bio}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {mentor.specializations.slice(0, 3).map(s => <Badge key={s} variant="primary" size="sm">{s}</Badge>)}
      </div>
      <Button
        variant="outline"
        size="sm"
        fullWidth
        className="mt-3"
        disabled={!mentor.isAvailable}
        onClick={() => onRequest?.(mentor._id)}
      >
        {mentor.isAvailable ? 'Request Mentorship' : 'Not Available'}
      </Button>
    </div>
  )
}
