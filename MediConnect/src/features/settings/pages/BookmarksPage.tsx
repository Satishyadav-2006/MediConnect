import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { postService } from '@/api/postService'
import { jobService } from '@/api/jobService'
import { eventService } from '@/api/eventService'
import { internshipService } from '@/api/internshipService'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import { Tabs, TabList, TabTrigger, TabContent } from '@/components/ui/Tabs'
import Skeleton from '@/components/ui/Skeleton'
import { NoPostsEmpty, NoJobsEmpty, NoEventsEmpty } from '@/components/empty-states'
import PostCard from '@/components/feed/PostCard'
import JobCard from '@/components/jobs/JobCard'
import EventCard from '@/components/events/EventCard'
import InternshipCard from '@/components/internships/InternshipCard'
import { extractList } from '@/lib/pagination'
import type { Post, Job, Event, Internship } from '@/types'

export default function BookmarksPage() {
  const queryClient = useQueryClient()

  const { data: savedPosts, isLoading: loadingPosts } = useQuery({
    queryKey: ['savedPosts'],
    queryFn: () => postService.getSavedPosts(1, 50).then(r => r.data),
  })

  const { data: savedJobs, isLoading: loadingJobs } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: () => jobService.getSavedJobs(1, 50).then(r => r.data),
  })

  const { data: savedEvents, isLoading: loadingEvents } = useQuery({
    queryKey: ['savedEvents'],
    queryFn: () => eventService.getSavedEvents(1, 50).then(r => r.data),
  })

  const { data: savedInternships, isLoading: loadingInternships } = useQuery({
    queryKey: ['savedInternships'],
    queryFn: () => internshipService.getSavedInternships(1, 50).then(r => r.data),
  })

  const posts = extractList<Post>(savedPosts)
  const jobs = extractList<Job>(savedJobs)
  const events = extractList<Event>(savedEvents)
  const internships = extractList<Internship>(savedInternships)

  const unsaveJob = useMutation({
    mutationFn: (id: string) => jobService.unsaveJob(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['savedJobs'] }); queryClient.invalidateQueries({ queryKey: ['jobs'] }) },
  })

  const unsaveEvent = useMutation({
    mutationFn: (id: string) => eventService.unsaveEvent(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['savedEvents'] }); queryClient.invalidateQueries({ queryKey: ['events'] }) },
  })

  const unsaveInternship = useMutation({
    mutationFn: (id: string) => internshipService.unsaveInternship(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['savedInternships'] }); queryClient.invalidateQueries({ queryKey: ['internships'] }) },
  })

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Bookmarks</h1>

      <Tabs defaultValue="posts">
        <TabList>
          <TabTrigger value="posts">Posts ({posts.length})</TabTrigger>
          <TabTrigger value="jobs">Jobs ({jobs.length})</TabTrigger>
          <TabTrigger value="internships">Internships ({internships.length})</TabTrigger>
          <TabTrigger value="events">Events ({events.length})</TabTrigger>
        </TabList>

        <TabContent value="posts">
          {loadingPosts ? (
            <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
          ) : posts.length === 0 ? (
            <NoPostsEmpty />
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
              {posts.map(post => (
                <motion.div key={post._id} variants={staggerItem}><PostCard post={post} /></motion.div>
              ))}
            </motion.div>
          )}
        </TabContent>

        <TabContent value="jobs">
          {loadingJobs ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
          ) : jobs.length === 0 ? (
            <NoJobsEmpty />
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {jobs.map(job => (
                <motion.div key={job._id} variants={staggerItem}>
                  <JobCard job={job} onSave={(id) => unsaveJob.mutate(id)} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabContent>

        <TabContent value="internships">
          {loadingInternships ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
          ) : internships.length === 0 ? (
            <NoJobsEmpty />
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {internships.map(internship => (
                <motion.div key={internship._id} variants={staggerItem}>
                  <InternshipCard internship={internship} onSave={() => unsaveInternship.mutate(internship._id)} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabContent>

        <TabContent value="events">
          {loadingEvents ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
          ) : events.length === 0 ? (
            <NoEventsEmpty />
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map(event => (
                <motion.div key={event._id} variants={staggerItem}>
                  <EventCard event={event} onSave={() => unsaveEvent.mutate(event._id)} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabContent>
      </Tabs>
    </motion.div>
  )
}
