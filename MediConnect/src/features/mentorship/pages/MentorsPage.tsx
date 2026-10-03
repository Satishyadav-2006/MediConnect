import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/config/i18n'
import { motion } from 'framer-motion'
import { useMentors } from '@/features/mentorship/hooks/useMentors'
import { SPECIALIZATIONS } from '@/constants'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import { Tabs, TabList, TabTrigger, TabContent } from '@/components/ui/Tabs'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { MentorCardSkeleton } from '@/components/skeletons'
import { NoConnectionsEmpty } from '@/components/empty-states'
import MentorCard from '@/components/mentorship/MentorCard'
import MentorOptInBanner from '@/components/mentorship/MentorOptInBanner'
import { extractList } from '@/lib/pagination'
import type { Mentor } from '@/types'

export default function MentorsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<Record<string, unknown>>({})
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useMentors(filters)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const mentors = data?.pages?.flatMap(p => extractList<Mentor>(p)) ?? []

  const handleRequest = (id: string) => {
    navigate(`/mentors/request/${id}`)
  }

  if (isError) {
    return (
      <motion.div {...pageTransition} className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Something went wrong</h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Failed to load mentors.</p>
      </motion.div>
    )
  }

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <MentorOptInBanner />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{t.mentorship.findMentor}</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          options={SPECIALIZATIONS.map(s => ({ value: s, label: s }))}
          value={filters.specialization as string}
          onChange={(v) => setFilters(prev => ({ ...prev, specialization: v }))}
          placeholder="Filter by specialization"
          className="w-64"
        />
        <Select
          options={[
            { value: 'available', label: 'Available Now' },
            { value: 'highly_rated', label: 'Top Rated' },
          ]}
          value={filters.availability as string}
          onChange={(v) => setFilters(prev => ({ ...prev, availability: v }))}
          placeholder="Availability"
          className="w-48"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <MentorCardSkeleton key={i} />)}
        </div>
      ) : mentors.length === 0 ? (
        <NoConnectionsEmpty />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mentors.map(mentor => (
            <motion.div key={mentor._id} variants={staggerItem}>
              <MentorCard mentor={mentor} onRequest={handleRequest} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <div ref={loadMoreRef} className="h-1" />
    </motion.div>
  )
}
