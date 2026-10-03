import { useState, useCallback } from 'react'
import { useI18n } from '@/config/i18n'
import { motion } from 'framer-motion'
import { FiSearch, FiFilter, FiX } from 'react-icons/fi'
import { useOrganizations } from '@/features/organization/hooks/useOrganizations'
import { useFollowOrganization } from '@/features/organization/hooks/useOrganization'
import { ORG_TYPES } from '@/features/organization/constants'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import OrganizationCard from '@/components/organization/OrganizationCard'
import { Skeleton } from '@/components/ui'
import Pagination from '@/components/ui/Pagination'
import { NoSearchResultsEmpty } from '@/components/empty-states'
import { extractList, getPagination } from '@/lib/pagination'
import type { Organization } from '@/types'

export default function OrganizationsPage() {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)

  const filters = {
    search: search || undefined,
    type: typeFilter || undefined,
  }

  const { data, isLoading } = useOrganizations(filters)
  const orgs = data?.pages?.flatMap(p => extractList<Organization>(p)) ?? []
  const totalPages = getPagination(data?.pages?.[0])?.totalPages || 1

  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({})
  const followMutation = useFollowOrganization('')

  const handleFollow = useCallback((orgId: string, isCurrentlyFollowing: boolean) => {
    setFollowingMap(prev => ({ ...prev, [orgId]: !isCurrentlyFollowing }))
    followMutation.mutate({ isFollowing: isCurrentlyFollowing })
  }, [followMutation])

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{t.organization.title}</h1>
        <Button variant="outline" size="sm" leftIcon={<FiFilter size={14} />} onClick={() => setShowFilters(!showFilters)}>
          Filters
        </Button>
      </div>

      <div className="relative">
        <Input
          leftIcon={<FiSearch size={16} />}
          placeholder={t.organization.search}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Filters</h3>
              <button onClick={() => { setTypeFilter(''); setPage(1) }} className="text-xs text-primary-500 hover:text-primary-600">Clear all</button>
            </div>
            <Select
              label="Organization Type"
              options={[...ORG_TYPES]}
              value={typeFilter}
              onChange={(v) => { setTypeFilter(v); setPage(1) }}
              placeholder="Any type"
            />
          </div>
        </motion.div>
      )}

      <div className="flex flex-wrap gap-2">
        <Chip selected={!typeFilter} onClick={() => { setTypeFilter(''); setPage(1) }}>All</Chip>
        {ORG_TYPES.map(t => (
          <Chip key={t.value} selected={typeFilter === t.value} onClick={() => { setTypeFilter(t.value); setPage(1) }}>{t.label}</Chip>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] overflow-hidden">
              <Skeleton className="h-24 w-full rounded-none" />
              <div className="px-4 pb-4">
                <Skeleton className="h-14 w-14 -mt-6 mb-2 rounded-xl" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-3 w-48 mb-1" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
          ))}
        </div>
      ) : orgs.length === 0 ? (
        <NoSearchResultsEmpty />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map(org => (
            <motion.div key={org._id} variants={staggerItem}>
              <OrganizationCard
                organization={org}
                isFollowing={followingMap[org._id] ?? false}
                onFollow={() => handleFollow(org._id, followingMap[org._id] ?? false)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-6" />}
    </motion.div>
  )
}
