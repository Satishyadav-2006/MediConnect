import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiHeart, FiMessageCircle, FiBookmark, FiShare2, FiMoreHorizontal, FiGlobe, FiUsers, FiLock } from 'react-icons/fi'
import { Avatar, Badge } from '@/components/ui'
import { cn, getRelativeTime, formatNumber } from '@/utils'
import type { Post, User } from '@/types'

interface PostDetailProps {
  post: Post
  onLike?: () => void
  onComment?: () => void
  onBookmark?: () => void
  onShare?: () => void
  onReport?: () => void
  onDelete?: () => void
  onEdit?: () => void
}

export default function PostDetail({ post, onLike, onComment, onBookmark, onShare, onReport, onDelete, onEdit }: PostDetailProps) {
  const [showMenu, setShowMenu] = useState(false)
  const author = post.author as User

  const visibilityIcon = post.visibility === 'public' ? <FiGlobe size={12} /> :
    post.visibility === 'connections' ? <FiUsers size={12} /> : <FiLock size={12} />

  return (
    <article className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar name={author?.fullName || 'User'} src={author?.profilePhoto} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--color-text-primary)] hover:underline cursor-pointer">
                  {author?.fullName}
                </span>
                <Badge variant="default" size="sm">{author?.role}</Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <span>{getRelativeTime(post.createdAt)}</span>
                <span>·</span>
                {visibilityIcon}
              </div>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]">
              <FiMoreHorizontal size={18} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] py-1 shadow-lg">
                {onEdit && <button onClick={() => { onEdit(); setShowMenu(false) }} className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-bg-hover)]">Edit</button>}
                {onDelete && <button onClick={() => { onDelete(); setShowMenu(false) }} className="w-full px-3 py-2 text-left text-sm text-danger-500 hover:bg-[var(--color-bg-hover)]">Delete</button>}
                {onReport && <button onClick={() => { onReport(); setShowMenu(false) }} className="w-full px-3 py-2 text-left text-sm text-danger-500 hover:bg-[var(--color-bg-hover)]">Report</button>}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3">
          <p className="whitespace-pre-wrap text-[var(--color-text-primary)]">{post.content}</p>
          {post.images && post.images.length > 0 && (
            <div className={cn('mt-3 gap-2', post.images.length > 1 ? 'grid grid-cols-2' : '')}>
              {post.images.map((img, i) => (
                <img key={i} src={img} alt="" className="w-full rounded-lg object-cover max-h-96" />
              ))}
            </div>
          )}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.tags.map(tag => (
                <span key={tag} className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-600 dark:bg-primary-900/20">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 border-t border-[var(--color-border-primary)] px-4 py-2">
        <button onClick={onLike} className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors', post.isLiked ? 'text-danger-500 font-medium' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]')}>
          <FiHeart size={18} fill={post.isLiked ? 'currentColor' : 'none'} />
          <span>{formatNumber(post.likesCount)}</span>
        </button>
        <button onClick={onComment} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]">
          <FiMessageCircle size={18} />
          <span>{formatNumber(post.commentsCount)}</span>
        </button>
        <button onClick={onShare} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]">
          <FiShare2 size={18} />
          <span>{formatNumber(post.sharesCount)}</span>
        </button>
        <div className="flex-1" />
        <button onClick={onBookmark} className={cn('rounded-lg p-1.5 transition-colors', post.isSaved ? 'text-primary-500' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]')}>
          <FiBookmark size={18} fill={post.isSaved ? 'currentColor' : 'none'} />
        </button>
      </div>
    </article>
  )
}
