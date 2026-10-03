import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMessageCircle } from 'react-icons/fi'
import { postService } from '@/api/postService'
import { extractList } from '@/lib/pagination'
import { showSuccess, showError } from '@/components/ui/Toast'
import { useI18n } from '@/config/i18n'
import { useLikeComment } from '@/features/comments/hooks/useComments'
import type { Comment } from '@/types'
import Avatar from '@/components/ui/Avatar'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import CommentCard from './CommentCard'

interface CommentSectionProps {
  postId: string
  comments?: Comment[]
  currentUserId?: string
}

export default function CommentSection({ postId, comments: initialComments, currentUserId }: CommentSectionProps) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [newComment, setNewComment] = useState('')
  const [showAll, setShowAll] = useState(false)

  const { data: commentsData, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const res = await postService.getComments(postId)
      return res.data
    },
    initialData: initialComments ? { items: initialComments } : undefined,
  })

  const comments = extractList<Comment>(commentsData)

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => postService.addComment(postId, content),
    onSuccess: () => {
      setNewComment('')
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      showSuccess('Comment added')
    },
    onError: () => showError('Failed to add comment'),
  })

  const replyMutation = useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId: string }) =>
      postService.addComment(postId, content, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      showSuccess('Reply added')
    },
    onError: () => showError('Failed to add reply'),
  })

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => postService.deleteComment(postId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      showSuccess('Comment deleted')
    },
    onError: () => showError('Failed to delete comment'),
  })

  const likeCommentMutation = useLikeComment(postId)

  const handleAddComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim())
    }
  }

  const topLevelComments = comments.filter(c => !c.parentComment)
  const displayedComments = showAll ? topLevelComments : topLevelComments.slice(0, 5)

  return (
    <div className="border-t border-[var(--color-border-primary)] px-4 py-3">
      {topLevelComments.length > 0 && (
        <p className="mb-3 text-sm font-medium text-[var(--color-text-secondary)]">
          {topLevelComments.length} comment{topLevelComments.length !== 1 ? 's' : ''}
        </p>
      )}

      <div className="flex items-center gap-3 mb-4">
        <Avatar name="You" size="sm" />
        <div className="relative flex-1">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment() }}
            placeholder={t.feed.writeComment}
            className="w-full rounded-full border border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] px-4 py-2 pr-12 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
          />
          {newComment.trim() && (
            <button
              onClick={handleAddComment}
              disabled={addCommentMutation.isPending}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-primary-500 hover:text-primary-600 disabled:opacity-50"
            >
              Post
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : topLevelComments.length === 0 ? (
        <div className="py-8 text-center">
          <FiMessageCircle size={32} className="mx-auto mb-2 text-[var(--color-text-muted)] opacity-50" />
          <p className="text-sm text-[var(--color-text-muted)]">{t.feed.noComments}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {displayedComments.map(comment => (
              <div key={comment._id}>
                <CommentCard
                  comment={comment}
                  currentUserId={currentUserId}
                  onReply={(commentId, content) => replyMutation.mutate({ content, parentId: commentId })}
                  onDelete={(commentId) => deleteMutation.mutate(commentId)}
                  onLike={(commentId) => likeCommentMutation.mutate(commentId)}
                />
                {comment.replies && comment.replies.length > 0 && (
                  <div>
                    {comment.replies.map(reply => (
                      <CommentCard
                        key={reply._id}
                        comment={reply}
                        currentUserId={currentUserId}
                        isReply
                        onReply={(commentId, content) => replyMutation.mutate({ content, parentId: commentId })}
                        onDelete={(commentId) => deleteMutation.mutate(commentId)}
                        onLike={(commentId) => likeCommentMutation.mutate(commentId)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </AnimatePresence>
          {topLevelComments.length > 5 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="ml-10 text-sm font-medium text-primary-500 hover:text-primary-600"
            >
              View {topLevelComments.length - 5} more comment{topLevelComments.length - 5 !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
