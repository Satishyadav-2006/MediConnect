import { motion } from 'framer-motion'
import { useMyEvents } from '@/features/events/hooks/useEvents'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import { Tabs, TabList, TabTrigger, TabContent } from '@/components/ui/Tabs'
import { EventCardSkeleton } from '@/components/skeletons'
import { NoEventsEmpty } from '@/components/empty-states'
import EventCard from '@/components/events/EventCard'
import { extractList } from '@/lib/pagination'
import type { Event } from '@/types'

export default function EventsMyEventsPage() {
  const { data: myEventsData, isLoading: loadingHosting } = useMyEvents()

  const myEvents = myEventsData?.pages?.flatMap(p => extractList<Event>(p)) ?? []
  const hostingEvents = myEvents.filter(e => e.status === 'upcoming' || e.status === 'live')
  const pastEvents = myEvents.filter(e => e.status === 'completed')

  const EventGrid = ({ data, isLoading }: { data: Event[]; isLoading: boolean }) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <EventCardSkeleton key={i} />)}
        </div>
      )
    }
    if (data.length === 0) return <NoEventsEmpty />
    return (
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(event => (
          <motion.div key={event._id} variants={staggerItem}>
            <EventCard event={event} />
          </motion.div>
        ))}
      </motion.div>
    )
  }

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">My Events</h1>

      <Tabs defaultValue="hosting">
        <TabList>
          <TabTrigger value="hosting">Hosting</TabTrigger>
          <TabTrigger value="past">Past</TabTrigger>
        </TabList>

        <TabContent value="hosting">
          <EventGrid data={hostingEvents} isLoading={loadingHosting} />
        </TabContent>

        <TabContent value="past">
          <EventGrid data={pastEvents} isLoading={loadingHosting} />
        </TabContent>
      </Tabs>
    </motion.div>
  )
}
