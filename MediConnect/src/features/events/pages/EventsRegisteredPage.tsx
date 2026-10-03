import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventService } from '@/api/eventService'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import { EventCardSkeleton } from '@/components/skeletons'
import { NoEventsEmpty } from '@/components/empty-states'
import EventCard from '@/components/events/EventCard'
import Button from '@/components/ui/Button'
import { extractList } from '@/lib/pagination'
import type { Event } from '@/types'

function useRegisteredEvents() {
  return useQuery({
    queryKey: ['registeredEvents'],
    queryFn: () => eventService.getRegisteredEvents(1, 100).then(r => r.data),
  })
}

function useUnregisterEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => eventService.unregister(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['registeredEvents'] })
      qc.invalidateQueries({ queryKey: ['events'] })
      toast.success('Unregistered from event')
    },
    onError: () => toast.error('Failed to unregister'),
  })
}

export default function EventsRegisteredPage() {
  const { data, isLoading } = useRegisteredEvents()
  const unregisterMutation = useUnregisterEvent()

  const events = extractList<Event>(data)

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Registered Events</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <EventCardSkeleton key={i} />)}
        </div>
      ) : events.length === 0 ? (
        <NoEventsEmpty />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(event => (
            <motion.div key={event._id} variants={staggerItem}>
              <EventCard event={event} />
              <div className="mt-2 px-1">
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    if (window.confirm('Are you sure you want to unregister from this event?')) {
                      unregisterMutation.mutate(event._id)
                    }
                  }}
                  disabled={unregisterMutation.isPending}
                >
                  Unregister
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
