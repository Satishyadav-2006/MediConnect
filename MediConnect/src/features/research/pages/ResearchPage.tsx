import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiBookOpen, FiExternalLink, FiCalendar, FiPlus } from 'react-icons/fi'
import { Badge, InfiniteScrollLoader } from '@/components/ui'
import { useResearchList } from '@/features/research/hooks/useResearch'
import { staggerContainer, staggerItem } from '@/animations'
import { extractList } from '@/lib/pagination'
import type { ResearchPublication } from '@/api/researchService'

export default function ResearchPage() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useResearchList()

  const publications = data?.pages?.flatMap(page => extractList<ResearchPublication>(page)) ?? []
  const filtered = publications.filter(p =>
    !search ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.authors.some(a => a.toLowerCase().includes(search.toLowerCase())) ||
    p.keywords?.some(k => k.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="mx-auto max-w-4xl py-8 px-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Research</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Browse and share medical research publications from the MediConnect community.
          </p>
        </div>
        <button
          onClick={() => navigate('/feed')}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
        >
          <FiPlus size={16} /> Share Research
        </button>
      </div>

      <div className="mt-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search publications, authors, keywords..."
          className="w-full rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-4 py-3 text-sm focus:border-primary-500 focus:outline-none"
        />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
              <FiBookOpen size={24} className="text-primary-500" />
            </div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">No publications</h3>
            <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">No research publications found. Be the first to share your research.</p>
          </div>
        ) : (
          <>
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
              {filtered.map(pub => (
                <motion.article
                  key={pub._id}
                  variants={staggerItem}
                  className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-500 dark:bg-primary-900/20">
                      <FiBookOpen size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--color-text-primary)] hover:text-primary-500 cursor-pointer">
                        {pub.title}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                        {Array.isArray(pub.authors) ? pub.authors.join(', ') : ''}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)]">
                        {pub.journal && <span className="flex items-center gap-1 truncate max-w-[200px]"><FiBookOpen size={12} /> {pub.journal}</span>}
                        {pub.publication_date && <span className="flex items-center gap-1"><FiCalendar size={12} /> {pub.publication_date.slice(0, 4)}</span>}
                        {pub.doi && <span className="flex items-center gap-1"><FiExternalLink size={12} /> DOI: {pub.doi}</span>}
                      </div>
                      {Array.isArray(pub.keywords) && pub.keywords.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {pub.keywords.slice(0, 5).map(kw => (
                            <Badge key={kw} variant="default" size="sm">{kw}</Badge>
                          ))}
                        </div>
                      )}
                      {pub.abstract && (
                        <p className="mt-2 text-sm text-[var(--color-text-secondary)] line-clamp-2">{pub.abstract}</p>
                      )}
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
            <InfiniteScrollLoader onLoadMore={fetchNextPage} hasMore={!!hasNextPage} loading={isFetchingNextPage} />
          </>
        )}
      </div>
    </div>
  )
}
