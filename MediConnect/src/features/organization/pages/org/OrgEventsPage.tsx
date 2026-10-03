import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiPlus, FiCalendar } from 'react-icons/fi'
import { useOrganizationEvents } from '@/features/organization/hooks/useOrganization'
import { useCurrentOrganizationContext } from '@/features/organization/context/CurrentOrganizationContext'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import EventCard from '@/components/events/EventCard'
import { EventCardSkeleton } from '@/components/skeletons'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import Pagination from '@/components/ui/Pagination'
import { extractList, getPagination } from '@/lib/pagination'
import { ROUTES } from '@/constants/routes'
import type { Event } from '@/types'

export default function OrgEventsPage() {
  const { orgId } = useCurrentOrganizationContext()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useOrganizationEvents(orgId || '')
  const events = data?.pages?.flatMap(p => extractList<Event>(p)) ?? []
  const totalPages = getPagination(data?.pages?.[0])?.totalPages || 1

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Organization Events</h2>
        <Link to={ROUTES.ORG_EVENT_CREATE}>
          <Button size="sm" leftIcon={<FiPlus size={14} />}>Create Event</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <EventCardSkeleton key={i} />)}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          variant="full-page"
          icon={<FiCalendar size={28} />}
          title="No events organized yet"
          description="Events you organize appear here. Create your first event to start engaging attendees."
          action={{ label: 'Create an event', onClick: () => navigate(ROUTES.ORG_EVENT_CREATE) }}
        />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map(event => (
            <motion.div key={event._id} variants={staggerItem}>
              <EventCard event={event} href={`/org/events/${event._id}`} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-6" />}
    </motion.div>
  )
}