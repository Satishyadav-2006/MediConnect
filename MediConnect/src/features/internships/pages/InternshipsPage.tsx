import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiFilter } from 'react-icons/fi'
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { internshipService } from '@/api/internshipService'
import { extractList, getNextPageParam } from '@/lib/pagination'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import { Tabs, TabList, TabTrigger, TabContent } from '@/components/ui/Tabs'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Skeleton from '@/components/ui/Skeleton'
import { NoJobsEmpty } from '@/components/empty-states'
import InternshipCard from '@/components/internships/InternshipCard'
import type { Internship } from '@/types'

function useInternships(filters?: Record<string, unknown>) {
  return useInfiniteQuery({
    queryKey: ['internships', filters],
    queryFn: ({ pageParam = 1 }) => internshipService.getInternships(pageParam, 20, filters as any).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
  })
}

function useSavedInternships() {
  return useInfiniteQuery({
    queryKey: ['savedInternships'],
    queryFn: ({ pageParam = 1 }) => internshipService.getSavedInternships(pageParam).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
  })
}

function useSaveInternship() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isSaved }: { id: string; isSaved: boolean }) => isSaved ? internshipService.unsaveInternship(id) : internshipService.saveInternship(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['internships'] }); qc.invalidateQueries({ queryKey: ['savedInternships'] }) },
  })
}

export default function InternshipsPage() {
  const [filters, setFilters] = useState<Record<string, unknown>>({})
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading } = useInternships({ ...filters })
  const { data: savedData, isLoading: loadingSaved } = useSavedInternships()
  const saveInternship = useSaveInternship()

  const internships = data?.pages?.flatMap(p => extractList<Internship>(p)) ?? []
  const savedInternships = savedData?.pages?.flatMap(p => extractList<Internship>(p)) ?? []

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Internships</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<FiFilter size={14} />} onClick={() => setShowFilters(!showFilters)}>Filters</Button>
        </div>
      </div>

      {showFilters && (
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
          <Select
            label="Type"
            options={[
              { value: 'paid', label: 'Paid' },
              { value: 'unpaid', label: 'Unpaid' },
              { value: 'stipend', label: 'Stipend' },
            ]}
            value={filters.type as string}
            onChange={(v) => setFilters(prev => ({ ...prev, type: v }))}
            placeholder="Any type"
          />
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] mt-3">
            <input type="checkbox" checked={!!filters.isRemote} onChange={e => setFilters(prev => ({ ...prev, isRemote: e.target.checked || undefined }))} className="rounded" />
            Remote only
          </label>
        </div>
      )}

      <Tabs defaultValue="recommended">
        <TabList>
          <TabTrigger value="recommended">Recommended</TabTrigger>
          <TabTrigger value="latest">Latest</TabTrigger>
          <TabTrigger value="saved">Saved</TabTrigger>
        </TabList>

        <TabContent value="recommended">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
          ) : internships.length === 0 ? (
            <NoJobsEmpty />
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {internships.map(intern => (
                <motion.div key={intern._id} variants={staggerItem}>
                  <InternshipCard internship={intern} onSave={(id, isSaved) => saveInternship.mutate({ id, isSaved })} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabContent>

        <TabContent value="latest">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
          ) : internships.length === 0 ? (
            <NoJobsEmpty />
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {internships.map(intern => (
                <motion.div key={intern._id} variants={staggerItem}>
                  <InternshipCard internship={intern} onSave={(id, isSaved) => saveInternship.mutate({ id, isSaved })} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabContent>

        <TabContent value="saved">
          {loadingSaved ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
          ) : savedInternships.length === 0 ? (
            <NoJobsEmpty />
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedInternships.map(intern => (
                <motion.div key={intern._id} variants={staggerItem}>
                  <InternshipCard internship={intern} onSave={(id, isSaved) => saveInternship.mutate({ id, isSaved })} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabContent>
      </Tabs>
    </motion.div>
  )
}
