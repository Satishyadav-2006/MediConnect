import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiArrowUp } from 'react-icons/fi'
import { useFeed, useDeletePost } from '@/features/feed/hooks/usePosts'
import { useJobs, useSaveJob } from '@/features/jobs/hooks/useJobs'
import { useInternships, useSaveInternship } from '@/features/internships/hooks/useInternships'
import { useEvents, useSaveEvent } from '@/features/events/hooks/useEvents'
import { useMentors } from '@/features/mentorship/hooks/useMentors'
import { FEED_CATEGORIES, POST_FEED_CATEGORIES } from '@/constants'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import PostComposer from '@/components/feed/PostComposer'
import PostCard from '@/components/feed/PostCard'
import CommentSection from '@/components/feed/CommentSection'
import JobCard from '@/components/jobs/JobCard'
import InternshipCard from '@/components/internships/InternshipCard'
import EventCard from '@/components/events/EventCard'
import MentorCard from '@/components/mentorship/MentorCard'
import { PostCardSkeleton, JobCardSkeleton, EventCardSkeleton, MentorCardSkeleton } from '@/components/skeletons'
import { NoPostsEmpty, NoJobsEmpty, NoEventsEmpty, NoConnectionsEmpty } from '@/components/empty-states'
import { Tabs, TabList, TabTrigger, TabContent, InfiniteScrollLoader } from '@/components/ui'
import { ImageLightbox } from '@/components/ui'
import { extractList } from '@/lib/pagination'
import type { Post, Job, Internship, Event, Mentor } from '@/types'

function JobsTab() {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useJobs()
  const saveJob = useSaveJob()
  const jobs = data?.pages?.flatMap(p => extractList<Job>(p)) ?? []

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => <JobCardSkeleton key={i} />)}
      </div>
    )
  }
  if (jobs.length === 0) return <NoJobsEmpty />
  return (
    <div className="space-y-4">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {jobs.map(job => (
          <motion.div key={job._id} variants={staggerItem}>
            <JobCard job={job} onSave={(id) => saveJob.mutate({ id, isSaved: job.isSaved })} />
          </motion.div>
        ))}
      </motion.div>
      <InfiniteScrollLoader onLoadMore={fetchNextPage} hasMore={!!hasNextPage} loading={isFetchingNextPage} />
    </div>
  )
}

function InternshipsTab() {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInternships()
  const saveInternship = useSaveInternship()
  const internships = data?.pages?.flatMap(p => extractList<Internship>(p)) ?? []

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => <JobCardSkeleton key={i} />)}
      </div>
    )
  }
  if (internships.length === 0) return <NoJobsEmpty />
  return (
    <div className="space-y-4">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {internships.map(internship => (
          <motion.div key={internship._id} variants={staggerItem}>
            <InternshipCard internship={internship} onSave={(id, isSaved) => saveInternship.mutate({ id, isSaved })} />
          </motion.div>
        ))}
      </motion.div>
      <InfiniteScrollLoader onLoadMore={fetchNextPage} hasMore={!!hasNextPage} loading={isFetchingNextPage} />
    </div>
  )
}

function EventsTab() {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useEvents()
  const saveEvent = useSaveEvent()
  const events = data?.pages?.flatMap(p => extractList<Event>(p)) ?? []

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => <EventCardSkeleton key={i} />)}
      </div>
    )
  }
  if (events.length === 0) return <NoEventsEmpty />
  return (
    <div className="space-y-4">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map(event => (
          <motion.div key={event._id} variants={staggerItem}>
            <EventCard event={event} onSave={(id, isSaved) => saveEvent.mutate({ id, isSaved })} />
          </motion.div>
        ))}
      </motion.div>
      <InfiniteScrollLoader onLoadMore={fetchNextPage} hasMore={!!hasNextPage} loading={isFetchingNextPage} />
    </div>
  )
}

function MentorsTab() {
  const navigate = useNavigate()
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useMentors()
  const mentors = data?.pages?.flatMap(p => extractList<Mentor>(p)) ?? []

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => <MentorCardSkeleton key={i} />)}
      </div>
    )
  }
  if (mentors.length === 0) return <NoConnectionsEmpty />
  return (
    <div className="space-y-4">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mentors.map(mentor => (
          <motion.div key={mentor._id} variants={staggerItem}>
            <MentorCard mentor={mentor} onRequest={(id) => navigate(`/mentors/request/${id}`)} />
          </motion.div>
        ))}
      </motion.div>
      <InfiniteScrollLoader onLoadMore={fetchNextPage} hasMore={!!hasNextPage} loading={isFetchingNextPage} />
    </div>
  )
}

export default function FeedPage() {
  const [category, setCategory] = useState('latest')
  const isPostCategory = (POST_FEED_CATEGORIES as readonly string[]).includes(category)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [showLightbox, setShowLightbox] = useState(false)
  const [showNewPostsBanner, setShowNewPostsBanner] = useState(false)

  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useFeed(category, isPostCategory)
  const deletePost = useDeletePost()

  const posts = data?.pages?.flatMap(page => extractList<Post>(page)) ?? []
  const uniquePosts = posts.filter((p, i, arr) => arr.findIndex(x => x._id === p._id) === i)

  const toggleComments = useCallback((postId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev)
      if (next.has(postId)) {
        next.delete(postId)
      } else {
        next.add(postId)
      }
      return next
    })
  }, [])

  const openLightbox = useCallback((images: string[], index: number) => {
    setLightboxImages(images)
    setLightboxIndex(index)
    setShowLightbox(true)
  }, [])

  if (isPostCategory && isError) {
    return (
      <motion.div {...pageTransition} className="flex flex-col items-center justify-center py-20">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Something went wrong</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Failed to load the feed. Please try again later.</p>
        </div>
      </motion.div>
    )
  }

  const renderCategoryContent = (cat: string) => {
    switch (cat) {
      case 'jobs':
        return <JobsTab />
      case 'internships':
        return <InternshipsTab />
      case 'events':
        return <EventsTab />
      case 'mentors':
        return <MentorsTab />
      default:
        return null
    }
  }

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-2xl space-y-4">
      <PostComposer />

      <Tabs defaultValue="latest">
        <TabList>
          {FEED_CATEGORIES.map(cat => (
            <TabTrigger key={cat.value} value={cat.value} onClick={() => setCategory(cat.value)}>
              {cat.label}
            </TabTrigger>
          ))}
        </TabList>

        {FEED_CATEGORIES.map(cat => (
          <TabContent key={cat.value} value={cat.value}>
            {isPostCategory ? (
              isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <PostCardSkeleton key={i} />)}
                </div>
              ) : uniquePosts.length === 0 ? (
                <NoPostsEmpty />
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {showNewPostsBanner && (
                      <motion.button
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onClick={() => { setShowNewPostsBanner(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                        className="w-full rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-600 hover:bg-primary-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <FiArrowUp size={14} />
                        New posts available
                      </motion.button>
                    )}
                  </AnimatePresence>

                  <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
                    {uniquePosts.map((post) => (
                      <motion.div key={post._id} variants={staggerItem}>
                        <PostCard
                          post={post}
                          onDelete={(id) => deletePost.mutate(id)}
                          onImageClick={openLightbox}
                          onToggleComments={() => toggleComments(post._id)}
                        />
                        <AnimatePresence>
                          {expandedComments.has(post._id) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <CommentSection postId={post._id} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </motion.div>

                  <InfiniteScrollLoader
                    onLoadMore={fetchNextPage}
                    hasMore={!!hasNextPage}
                    loading={isFetchingNextPage}
                  />
                </div>
              )
            ) : (
              renderCategoryContent(cat.value)
            )}
          </TabContent>
        ))}
      </Tabs>

      <ImageLightbox
        images={lightboxImages}
        isOpen={showLightbox}
        onClose={() => setShowLightbox(false)}
        initialIndex={lightboxIndex}
      />
    </motion.div>
  )
}
