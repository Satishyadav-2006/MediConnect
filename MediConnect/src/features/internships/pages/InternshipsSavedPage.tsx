import { motion } from 'framer-motion'
import { FiBookmark } from 'react-icons/fi'
import { useQueryClient, useMutation, useInfiniteQuery } from '@tanstack/react-query'
import { internshipService } from '@/api/internshipService'
import { extractList, getNextPageParam } from '@/lib/pagination'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import { JobCardSkeleton } from '@/components/skeletons'
import InternshipCard from '@/components/internships/InternshipCard'
import type { Internship } from '@/types'

function useSavedInternships() {
  return useInfiniteQuery({
    queryKey: ['savedInternships'],
    queryFn: ({ pageParam = 1 }) => internshipService.getSavedInternships(pageParam).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
  })
}

function useUnsaveInternship() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => internshipService.unsaveInternship(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['savedInternships'] })
      qc.invalidateQueries({ queryKey: ['internships'] })
    },
  })
}

export default function InternshipsSavedPage() {
  const { data, isLoading } = useSavedInternships()
  const unsaveMutation = useUnsaveInternship()

  const internships = data?.pages?.flatMap(p => extractList<Internship>(p)) ?? []

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Saved Internships</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <JobCardSkeleton key={i} />)}
        </div>
      ) : internships.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <FiBookmark size={48} className="text-[var(--color-text-muted)]" />
          <h2 className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">No saved internships</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Save internships to view them here.</p>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {internships.map(intern => (
            <motion.div key={intern._id} variants={staggerItem}>
              <InternshipCard internship={intern} onSave={(id) => unsaveMutation.mutate(id)} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
