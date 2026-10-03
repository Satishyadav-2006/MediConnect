import { motion } from 'framer-motion'
import { useEvents, useMyEvents, useRegisteredEvents, useSaveEvent } from '@/features/events/hooks/useEvents'
import { EVENT_TABS } from '@/constants'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import { Tabs, TabList, TabTrigger, TabContent } from '@/components/ui/Tabs'
import { EventCardSkeleton } from '@/components/skeletons'
import { NoEventsEmpty } from '@/components/empty-states'
import EventCard from '@/components/events/EventCard'
import { extractList } from '@/lib/pagination'
import type { Event } from '@/types'

function EventGrid({ data, isLoading }: { data: Event[]; isLoading: boolean }) {
  const saveEvent = useSaveEvent()
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => <EventCardSkeleton key={i} />)}
      </div>
    )
  }
  if (data.length === 0) return <NoEventsEmpty />
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map(event => (
        <motion.div key={event._id} variants={staggerItem}>
          <EventCard event={event} onSave={(id, isSaved) => saveEvent.mutate({ id, isSaved })} />
        </motion.div>
      ))}
    </motion.div>
  )
}

function TimeEventsTab({ status }: { status: 'upcoming' | 'live' | 'completed' }) {
  const { data, isLoading, isError } = useEvents({ status })
  const events = data?.pages?.flatMap(p => extractList<Event>(p)) ?? []
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Something went wrong</h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Failed to load events.</p>
      </div>
    )
  }
  return <EventGrid data={events} isLoading={isLoading} />
}

function MyEventsTab() {
  const { data, isLoading, isError } = useMyEvents()
  const events = data?.pages?.flatMap(p => extractList<Event>(p)) ?? []
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Something went wrong</h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Failed to load your events.</p>
      </div>
    )
  }
  return <EventGrid data={events} isLoading={isLoading} />
}

function RegisteredEventsTab() {
  const { data, isLoading, isError } = useRegisteredEvents()
  const events = extractList<Event>(data)
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Something went wrong</h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Failed to load registered events.</p>
      </div>
    )
  }
  return <EventGrid data={events} isLoading={isLoading} />
}

export default function EventsPage() {
  return (
    <motion.div {...pageTransition} className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Events</h1>

      <Tabs defaultValue="upcoming">
        <TabList>
          {EVENT_TABS.map(t => (
            <TabTrigger key={t.value} value={t.value}>{t.label}</TabTrigger>
          ))}
        </TabList>

        <TabContent value="upcoming"><TimeEventsTab status="upcoming" /></TabContent>
        <TabContent value="live"><TimeEventsTab status="live" /></TabContent>
        <TabContent value="completed"><TimeEventsTab status="completed" /></TabContent>
        <TabContent value="my_events"><MyEventsTab /></TabContent>
        <TabContent value="registered"><RegisteredEventsTab /></TabContent>
      </Tabs>
    </motion.div>
  )
}
