import { Link } from 'react-router-dom'
import { FiUsers, FiBriefcase, FiCalendar, FiExternalLink, FiMapPin, FiGlobe } from 'react-icons/fi'
import { formatNumber, formatDate } from '@/utils'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Skeleton from '@/components/ui/Skeleton'
import type { Organization } from '@/types'

interface OrganizationSidebarProps {
  organization: Organization
  upcomingEvents?: { _id: string; title: string; startDate: string }[]
  recentEmployees?: { _id: string; fullName: string; profilePhoto?: string; department?: string }[]
  isLoadingEvents?: boolean
  isLoadingEmployees?: boolean
}

export default function OrganizationSidebar({ organization, upcomingEvents = [], recentEmployees = [], isLoadingEvents, isLoadingEmployees }: OrganizationSidebarProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Quick Stats</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"><FiUsers size={14} />Followers</span>
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">{formatNumber(organization.followersCount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"><FiBriefcase size={14} />Employees</span>
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">{formatNumber(organization.employeesCount)}</span>
          </div>
          {organization.specializations?.length > 0 && (
            <div className="pt-2 border-t border-[var(--color-border-primary)]">
              <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">Specializations</p>
              <div className="flex flex-wrap gap-1">
                {organization.specializations.map(s => (
                  <Badge key={s} variant="default" size="sm">{s}</Badge>
                ))}
              </div>
            </div>
          )}
          {organization.location && (
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <FiMapPin size={14} />{organization.location}
            </div>
          )}
          {organization.website && (
            <a href={organization.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600">
              <FiGlobe size={14} />Website<FiExternalLink size={12} />
            </a>
          )}
          {organization.foundedYear && (
            <div className="text-xs text-[var(--color-text-muted)]">Founded {organization.foundedYear}</div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Upcoming Events</h3>
          <Link to={`/organizations/${organization._id}`} className="text-xs text-primary-500 hover:text-primary-600">View all</Link>
        </div>
        {isLoadingEvents ? (
          <div className="space-y-2">
            {[1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : upcomingEvents.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)]">No upcoming events</p>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.slice(0, 3).map(event => (
              <Link key={event._id} to={`/events/${event._id}`} className="block rounded-lg p-2 hover:bg-[var(--color-bg-hover)] transition-colors">
                <p className="text-xs font-medium text-[var(--color-text-primary)] line-clamp-1">{event.title}</p>
                <p className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] mt-0.5">
                  <FiCalendar size={10} />{formatDate(event.startDate)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Recent Employees</h3>
        {isLoadingEmployees ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        ) : recentEmployees.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)]">No employees listed</p>
        ) : (
          <div className="space-y-2">
            {recentEmployees.slice(0, 5).map(emp => (
              <Link key={emp._id} to={`/profile/${emp._id}`} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-[var(--color-bg-hover)] transition-colors">
                <Avatar src={emp.profilePhoto} name={emp.fullName} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{emp.fullName}</p>
                  {emp.department && <p className="text-[10px] text-[var(--color-text-muted)] truncate">{emp.department}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Quick Links</h3>
        <div className="space-y-1">
          <Link to={`/organizations/${organization._id}?tab=jobs`} className="block rounded-lg px-2 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors">
            View Open Positions
          </Link>
          <Link to={`/organizations/${organization._id}?tab=internships`} className="block rounded-lg px-2 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors">
            Browse Internships
          </Link>
          <Link to={`/organizations/${organization._id}?tab=events`} className="block rounded-lg px-2 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors">
            Upcoming Events
          </Link>
          <Link to={`/organizations/${organization._id}?tab=employees`} className="block rounded-lg px-2 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors">
            Employee Directory
          </Link>
        </div>
      </div>
    </div>
  )
}
