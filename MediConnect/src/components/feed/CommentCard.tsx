import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiHeart, FiMessageCircle, FiMoreHorizontal, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { cn, getRelativeTime } from '@/utils'
import type { Comment } from '@/types'
import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import Input from '@/components/ui/Input'

interface CommentCardProps {
  comment: Comment
  currentUserId?: string
  onReply?: (commentId: string, content: string) => void
  onEdit?: (commentId: string, content: string) => void
  onDelete?: (commentId: string) => void
  onLike?: (commentId: string) => void
  isReply?: boolean
}

function highlightMentions(text: string) {
  const parts = text.split(/(@\w+)/g)
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className="font-semibold text-primary-500">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

export default function CommentCard({ comment, currentUserId, onReply, onEdit, onDelete, onLike, isReply }: CommentCardProps) {
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const author = comment.author
  const isOwner = currentUserId === author._id

  const handleReply = () => {
    if (replyText.trim()) {
      onReply?.(comment._id, replyText.trim())
      setReplyText('')
      setShowReplyInput(false)
    }
  }

  const handleEdit = () => {
    if (editText.trim() && editText.trim() !== comment.content) {
      onEdit?.(comment._id, editText.trim())
      setIsEditing(false)
    } else {
      setIsEditing(false)
      setEditText(comment.content)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3', isReply && 'ml-10 mt-3')}
    >
      <Link to={`/profile/${author.username}`} className="shrink-0">
        <Avatar src={author.profilePhoto} name={author.fullName} size={isReply ? 'xs' : 'sm'} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="rounded-xl bg-[var(--color-bg-tertiary)] px-3 py-2">
          <div className="flex items-center gap-2">
            <Link to={`/profile/${author.username}`} className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-primary-500">
              {author.fullName}
            </Link>
            <span className="text-xs text-[var(--color-text-muted)]">{getRelativeTime(comment.createdAt)}</span>
            {comment.isLiked !== undefined && (
              <Dropdown
                trigger={
                  <button className="ml-auto rounded p-0.5 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 hover:bg-[var(--color-bg-hover)] transition-opacity">
                    <FiMoreHorizontal size={14} />
                  </button>
                }
                items={[
                  ...(isOwner ? [
                    { label: 'Edit', icon: <FiEdit2 size={14} />, onClick: () => setIsEditing(true) },
                    { label: 'Delete', icon: <FiTrash2 size={14} />, onClick: () => onDelete?.(comment._id), danger: true },
                  ] : []),
                ]}
              />
            )}
          </div>
          {isEditing ? (
            <div className="mt-1">
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(); if (e.key === 'Escape') { setIsEditing(false); setEditText(comment.content) } }}
                className="text-sm"
                autoFocus
              />
              <div className="mt-1 flex gap-2">
                <button onClick={() => { setIsEditing(false); setEditText(comment.content) }} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">Cancel</button>
                <button onClick={handleEdit} className="text-xs font-medium text-primary-500 hover:text-primary-600">Save</button>
              </div>
            </div>
          ) : (
            <p className="mt-0.5 text-sm text-[var(--color-text-primary)] whitespace-pre-wrap">{highlightMentions(comment.content)}</p>
          )}
        </div>
        <div className="mt-1 flex items-center gap-3">
          <button
            onClick={() => onLike?.(comment._id)}
            className={cn(
              'flex items-center gap-1 text-xs font-medium transition-colors',
              comment.isLiked ? 'text-danger-500' : 'text-[var(--color-text-muted)] hover:text-danger-500'
            )}
          >
            <FiHeart size={12} fill={comment.isLiked ? 'currentColor' : 'none'} />
            {comment.likesCount > 0 && comment.likesCount}
          </button>
          {!isReply && (
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="flex items-center gap-1 text-xs font-medium text-[var(--color-text-muted)] hover:text-primary-500 transition-colors"
            >
              <FiMessageCircle size={12} /> Reply
            </button>
          )}
        </div>

        {showReplyInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 flex items-center gap-2"
          >
            <Input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleReply() }}
              placeholder="Write a reply..."
              className="text-sm"
            />
            {replyText.trim() && (
              <button
                onClick={handleReply}
                className="text-sm font-medium text-primary-500 hover:text-primary-600 shrink-0"
              >
                Post
              </button>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
