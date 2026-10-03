import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiPlus } from 'react-icons/fi'
import { useOrganizationPosts } from '@/features/organization/hooks/useOrganization'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import PostCard from '@/components/feed/PostCard'
import { PostCardSkeleton } from '@/components/skeletons'
import { NoPostsEmpty } from '@/components/empty-states'
import Button from '@/components/ui/Button'
import Pagination from '@/components/ui/Pagination'
import { extractList, getPagination } from '@/lib/pagination'
import type { Post } from '@/types'

export default function OrganizationPostsPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading } = useOrganizationPosts(id || '')
  const posts = data?.pages?.flatMap(p => extractList<Post>(p)) ?? []
  const totalPages = getPagination(data?.pages?.[0])?.totalPages || 1

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Posts</h2>
        <Link to="/feed">
          <Button size="sm" leftIcon={<FiPlus size={14} />}>Create Post</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <PostCardSkeleton key={i} />)}
        </div>
      ) : posts.length === 0 ? (
        <NoPostsEmpty />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
          {posts.map(post => (
            <motion.div key={post._id} variants={staggerItem}>
              <PostCard post={post} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {totalPages > 1 && <Pagination page={1} totalPages={totalPages} onPageChange={() => {}} className="mt-6" />}
    </motion.div>
  )
}
