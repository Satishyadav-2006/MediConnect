import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowUpRight, FiFileText } from 'react-icons/fi'
import { useOrganizationPosts } from '@/features/organization/hooks/useOrganization'
import { useCurrentOrganizationContext } from '@/features/organization/context/CurrentOrganizationContext'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import PostCard from '@/components/feed/PostCard'
import { PostCardSkeleton } from '@/components/skeletons'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import Pagination from '@/components/ui/Pagination'
import { extractList, getPagination } from '@/lib/pagination'
import { ROUTES } from '@/constants/routes'
import type { Post } from '@/types'

export default function OrgPostsPage() {
  const { orgId } = useCurrentOrganizationContext()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useOrganizationPosts(orgId || '')
  const posts = data?.pages?.flatMap(p => extractList<Post>(p)) ?? []
  const totalPages = getPagination(data?.pages?.[0])?.totalPages || 1

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Organization Posts</h2>
        <Link to={ROUTES.FEED}>
          <Button size="sm" variant="outline" rightIcon={<FiArrowUpRight size={14} />}>Open community feed</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <PostCardSkeleton key={i} />)}</div>
      ) : posts.length === 0 ? (
        <EmptyState
          variant="full-page"
          icon={<FiFileText size={28} />}
          title="No posts published yet"
          description="Posts tied to your organization appear here. Author posts from the community feed to engage your audience."
          action={{ label: 'Open community feed', onClick: () => navigate(ROUTES.FEED) }}
        />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mx-auto max-w-2xl space-y-3">
          {posts.map(post => (
            <motion.div key={post._id} variants={staggerItem}>
              <PostCard post={post} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-6" />}
    </motion.div>
  )
}