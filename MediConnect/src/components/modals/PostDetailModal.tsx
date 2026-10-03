import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FiHeart, FiMessageCircle, FiBookmark, FiShare2, FiMoreHorizontal } from 'react-icons/fi'
import { Avatar, Badge } from '@/components/ui'
import { cn, getRelativeTime, formatNumber } from '@/utils'
import type { Post, User } from '@/types'
import ShareDialog from './ShareDialog'

interface PostDetailModalProps {
  post: Post
  onLike?: () => void
  onComment?: (content: string) => void
  onBookmark?: () => void
  onShare?: () => void
  onClose?: () => void
}

export default function PostDetailModal({ post, onLike, onComment, onBookmark }: PostDetailModalProps) {
  const [comment, setComment] = useState('')
  const [showShare, setShowShare] = useState(false)
  const author = post.author as User

  const handleSubmitComment = useCallback(() => {
    if (!comment.trim()) return
    onComment?.(comment)
    setComment('')
  }, [comment, onComment])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <Avatar name={author?.fullName || 'User'} src={author?.profilePhoto} size="md" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--color-text-primary)]">{author?.fullName}</span>
                <Badge variant="default" size="sm">{author?.role}</Badge>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">{getRelativeTime(post.createdAt)}</p>
            </div>
            <button className="rounded-lg p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]">
              <FiMoreHorizontal size={20} />
            </button>
          </div>
          <div className="mt-3">
            <p className="whitespace-pre-wrap text-[var(--color-text-primary)]">{post.content}</p>
            {post.images && post.images.length > 0 && (
              <div className={cn('mt-3 gap-2', post.images.length > 1 ? 'grid grid-cols-2' : '')}>
                {post.images.map((img, i) => (
                  <img key={i} src={img} alt="" className="w-full rounded-lg object-cover" />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 border-t border-[var(--color-border-primary)] px-4 py-2">
          <button onClick={onLike} className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors', post.isLiked ? 'text-danger-500' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]')}>
            <FiHeart size={18} fill={post.isLiked ? 'currentColor' : 'none'} />
            <span>{formatNumber(post.likesCount)}</span>
          </button>
          <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]">
            <FiMessageCircle size={18} />
            <span>{formatNumber(post.commentsCount)}</span>
          </button>
          <button onClick={() => setShowShare(true)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]">
            <FiShare2 size={18} />
            <span>{formatNumber(post.sharesCount)}</span>
          </button>
          <div className="flex-1" />
          <button onClick={onBookmark} className={cn('rounded-lg p-1.5 transition-colors', post.isSaved ? 'text-primary-500' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]')}>
            <FiBookmark size={18} fill={post.isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="border-t border-[var(--color-border-primary)] p-4">
          <div className="flex gap-3">
            <Avatar name="You" size="sm" />
            <div className="flex-1">
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Write a comment..."
                rows={2}
                className="w-full resize-none rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-primary-500 focus:outline-none"
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleSubmitComment}
                  disabled={!comment.trim()}
                  className="rounded-lg bg-primary-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ShareDialog isOpen={showShare} onClose={() => setShowShare(false)} url={window.location.href} title={post.content} postId={post._id} />
    </div>
  )
}
