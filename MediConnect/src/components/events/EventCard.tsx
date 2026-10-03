import { Link } from 'react-router-dom'
import { FiCalendar, FiMapPin, FiUsers, FiBookmark } from 'react-icons/fi'
import { formatFullDate } from '@/utils'
import type { Event } from '@/types'
import Badge from '@/components/ui/Badge'

interface EventCardProps {
  event: Event
  href?: string
  onSave?: (id: string, isSaved: boolean) => void
}

export default function EventCard({ event, href, onSave }: EventCardProps) {
  const statusColors = { upcoming: 'info' as const, live: 'danger' as const, completed: 'success' as const, cancelled: 'default' as const }
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] hover:shadow-md transition-shadow">
      <div className="h-36 bg-gradient-to-br from-primary-500 to-primary-700 relative">
        {event.banner && <img src={event.banner} alt="" className="h-full w-full object-cover" />}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <button onClick={() => onSave?.(event._id, event.isSaved)} className="rounded-lg bg-white/90 p-1.5 text-[var(--color-text-muted)] hover:text-primary-500" title={event.isSaved ? 'Unsave' : 'Save'}>
            <FiBookmark size={15} fill={event.isSaved ? 'currentColor' : 'none'} />
          </button>
          <Badge variant={statusColors[event.status]} dot>{event.status}</Badge>
        </div>
      </div>
      <div className="p-4">
        <Link to={href ?? `/events/${event._id}`}>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-primary-500 line-clamp-2">{event.title}</h3>
        </Link>
        <div className="mt-2 space-y-1 text-xs text-[var(--color-text-muted)]">
          <div className="flex items-center gap-1.5"><FiCalendar size={12} />{formatFullDate(event.startDate)}</div>
          <div className="flex items-center gap-1.5"><FiMapPin size={12} />{event.mode === 'online' ? 'Online' : event.location || 'TBA'}</div>
          <div className="flex items-center gap-1.5"><FiUsers size={12} />{event.attendeesCount} attendees</div>
        </div>
        {event.isRegistered && <Badge variant="success" className="mt-2">Registered</Badge>}
      </div>
    </div>
  )
}
