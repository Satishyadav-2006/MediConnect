import { motion } from 'framer-motion'
import { useSavedJobs, useSaveJob } from '@/features/jobs/hooks/useJobs'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import { JobCardSkeleton } from '@/components/skeletons'
import { NoJobsEmpty } from '@/components/empty-states'
import JobCard from '@/components/jobs/JobCard'
import { extractList } from '@/lib/pagination'
import type { Job } from '@/types'

export default function JobsSavedPage() {
  const { data, isLoading } = useSavedJobs()
  const saveJob = useSaveJob()

  const jobs = data?.pages?.flatMap(p => extractList<Job>(p)) ?? []

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Saved Jobs</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <JobCardSkeleton key={i} />)}
        </div>
      ) : jobs.length === 0 ? (
        <NoJobsEmpty />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {jobs.map(job => (
            <motion.div key={job._id} variants={staggerItem}>
              <JobCard job={job} onSave={(id) => saveJob.mutate({ id, isSaved: true })} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
