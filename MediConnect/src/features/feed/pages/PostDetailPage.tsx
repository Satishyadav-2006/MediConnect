import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FiArrowLeft } from 'react-icons/fi'
import { postService } from '@/api/postService'
import PostDetail from '@/components/feed/PostDetail'
import CommentSection from '@/components/feed/CommentSection'
import { PostCardSkeleton } from '@/components/skeletons'
import { pageTransition } from '@/animations'
import type { Post } from '@/types'

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postService.getPost(postId!).then(r => r.data),
    enabled: !!postId,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => postService.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      navigate('/feed')
    },
  })

  const likeMutation = useMutation({
    mutationFn: ({ id, isLiked }: { id: string; isLiked: boolean }) =>
      isLiked ? postService.unlikePost(id) : postService.likePost(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['post', postId] }),
  })

  const saveMutation = useMutation({
    mutationFn: ({ id, isSaved }: { id: string; isSaved: boolean }) =>
      isSaved ? postService.unsavePost(id) : postService.savePost(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['post', postId] }),
  })

  if (isLoading) {
    return (
      <motion.div {...pageTransition} className="mx-auto max-w-2xl space-y-4 py-4">
        <PostCardSkeleton />
      </motion.div>
    )
  }

  if (isError || !data) {
    return (
      <motion.div {...pageTransition} className="mx-auto max-w-2xl py-20 text-center">
        <p className="text-[var(--color-text-secondary)]">Post not found.</p>
        <button onClick={() => navigate('/feed')} className="mt-4 text-sm font-medium text-primary-500 hover:text-primary-600">
          Back to Feed
        </button>
      </motion.div>
    )
  }

  const post = data as Post

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-2xl space-y-4 py-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <FiArrowLeft size={16} /> Back
      </button>

      <PostDetail
        post={post}
        onLike={() => likeMutation.mutate({ id: post._id, isLiked: post.isLiked })}
        onBookmark={() => saveMutation.mutate({ id: post._id, isSaved: post.isSaved })}
        onDelete={() => deleteMutation.mutate(post._id)}
      />

      <CommentSection postId={post._id} />
    </motion.div>
  )
}
