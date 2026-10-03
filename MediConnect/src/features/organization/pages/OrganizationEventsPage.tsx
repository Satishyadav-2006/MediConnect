import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiPlus } from 'react-icons/fi'
import { useOrganizationEvents } from '@/features/organization/hooks/useOrganization'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import EventCard from '@/components/events/EventCard'
import { EventCardSkeleton } from '@/components/skeletons'
import { NoEventsEmpty } from '@/components/empty-states'
import Button from '@/components/ui/Button'
import Pagination from '@/components/ui/Pagination'
import { extractList, getPagination } from '@/lib/pagination'
import type { Event } from '@/types'

export default function OrganizationEventsPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading } = useOrganizationEvents(id || '')
  const events = data?.pages?.flatMap(p => extractList<Event>(p)) ?? []
  const totalPages = getPagination(data?.pages?.[0])?.totalPages || 1

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Events</h2>
        <Button size="sm" leftIcon={<FiPlus size={14} />}>Create Event</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <EventCardSkeleton key={i} />)}
        </div>
      ) : events.length === 0 ? (
        <NoEventsEmpty />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {events.map(event => (
            <motion.div key={event._id} variants={staggerItem}>
              <EventCard event={event} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {totalPages > 1 && <Pagination page={1} totalPages={totalPages} onPageChange={() => {}} className="mt-6" />}
    </motion.div>
  )
}
