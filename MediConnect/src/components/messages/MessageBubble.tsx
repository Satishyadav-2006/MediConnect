import { useState, useRef, useEffect } from 'react'
import { FiCheck, FiMoreHorizontal, FiCopy, FiTrash2, FiEdit2, FiCornerUpLeft, FiFile, FiDownload, FiBookmark, FiShare2, FiX } from 'react-icons/fi'
import { cn, getRelativeTime, truncateText } from '@/utils'
import { messageService } from '@/api/messageService'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { showSuccess, showError } from '@/components/ui/Toast'
import type { Message, Conversation } from '@/types'
import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import Button from '@/components/ui/Button'

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showAvatar: boolean
  currentUserId?: string
  onReply?: (message: Message) => void
  onForward?: (message: Message) => void
  conversations?: Conversation[]
}

function linkify(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary-500 underline hover:text-primary-600">
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

export default function MessageBubble({ message, isOwn, showAvatar, currentUserId, onReply, onForward, conversations }: MessageBubbleProps) {
  const queryClient = useQueryClient()
  const [showReactions, setShowReactions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(message.content)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showForwardDialog, setShowForwardDialog] = useState(false)
  const editInputRef = useRef<HTMLInputElement>(null)
  const reactionTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const isOwner = currentUserId === message.sender._id

  const reactions = message.reactions

  const deleteMutation = useMutation({
    mutationFn: (forEveryone: boolean) => messageService.deleteMessage(message._id, forEveryone),
    onSuccess: () => {
      showSuccess('Message deleted')
      queryClient.invalidateQueries({ queryKey: ['messages', message.conversation] })
      setShowDeleteDialog(false)
    },
    onError: () => showError('Failed to delete message'),
  })

  const editMutation = useMutation({
    mutationFn: (content: string) => messageService.editMessage(message._id, content),
    onSuccess: () => {
      showSuccess('Message edited')
      queryClient.invalidateQueries({ queryKey: ['messages', message.conversation] })
      setIsEditing(false)
    },
    onError: () => showError('Failed to edit message'),
  })

  const pinMutation = useMutation({
    mutationFn: () => message.isPinned ? messageService.unpinMessage(message._id) : messageService.pinMessage(message._id),
    onSuccess: () => {
      showSuccess(message.isPinned ? 'Message unpinned' : 'Message pinned')
      queryClient.invalidateQueries({ queryKey: ['messages', message.conversation] })
    },
    onError: () => showError('Failed to update pin'),
  })

  const reactionMutation = useMutation({
    mutationFn: ({ emoji, remove }: { emoji: string; remove?: boolean }) =>
      remove ? messageService.removeReaction(message._id, emoji) : messageService.reactToMessage(message._id, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', message.conversation] })
    },
    onError: () => showError('Failed to update reaction'),
  })

  const forwardMutation = useMutation({
    mutationFn: (conversationId: string) => messageService.forwardMessage(message._id, conversationId),
    onSuccess: () => {
      showSuccess('Message forwarded')
      setShowForwardDialog(false)
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: () => showError('Failed to forward message'),
  })

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    showSuccess('Copied to clipboard')
  }

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== message.content) {
      editMutation.mutate(editText.trim())
    } else {
      setIsEditing(false)
      setEditText(message.content)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditText(message.content)
  }

  const handleReaction = (emoji: string) => {
    const existing = reactions?.find((r) => r.emoji === emoji)
    const hasReacted = existing?.users.includes(currentUserId || '')
    reactionMutation.mutate({ emoji, remove: hasReacted })
    setShowReactions(false)
  }

  const handleReactionHover = () => {
    if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current)
    setShowReactions(true)
  }

  const handleReactionLeave = () => {
    reactionTimeoutRef.current = setTimeout(() => setShowReactions(false), 500)
  }

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    return () => { if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current) }
  }, [])

  if (message.isDeleted) {
    return (
      <div className={cn('flex gap-2', isOwn ? 'justify-end' : 'justify-start')}>
        {!isOwn && showAvatar && <Avatar src={message.sender.profilePhoto} name={message.sender.fullName} size="sm" className="mt-auto" />}
        {!isOwn && !showAvatar && <div className="w-8" />}
        <div className={cn(
          'rounded-xl px-3 py-2 text-sm italic',
          'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'
        )}>
          This message has been deleted
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex gap-2 group', isOwn ? 'justify-end' : 'justify-start')}>
      {!isOwn && showAvatar && (
        <Avatar src={message.sender.profilePhoto} name={message.sender.fullName} size="sm" className="mt-auto" />
      )}
      {!isOwn && !showAvatar && <div className="w-8 shrink-0" />}

      <div
        className={cn('relative max-w-[70%]')}
        onMouseEnter={handleReactionHover}
        onMouseLeave={handleReactionLeave}
      >
        {message.replyTo && (
          <div className={cn(
            'mb-1 rounded-lg border-l-2 border-primary-500 bg-[var(--color-bg-tertiary)] px-2 py-1 text-xs',
          )}>
            <p className="font-medium text-primary-500">{message.replyTo.sender.fullName}</p>
            <p className="text-[var(--color-text-muted)] truncate">{truncateText(message.replyTo.content, 60)}</p>
          </div>
        )}

        {message.type === 'image' && message.fileUrl && (
          <div className="mb-1 overflow-hidden rounded-lg">
            <img src={message.fileUrl} alt="" className="max-h-64 rounded-lg object-cover" />
          </div>
        )}

        {message.type === 'file' && (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'mb-1 flex items-center gap-2 rounded-lg border border-[var(--color-border-primary)] px-3 py-2 hover:bg-[var(--color-bg-hover)] transition-colors',
            )}
          >
            <FiFile size={20} className="shrink-0 text-primary-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{message.fileName || 'File'}</p>
            </div>
            <FiDownload size={16} className="shrink-0 text-[var(--color-text-muted)]" />
          </a>
        )}

        {(message.type === 'text' || message.type === undefined) && message.content && (
          isEditing ? (
            <div className={cn(
              'rounded-2xl px-2 py-1',
              isOwn ? 'bg-primary-500 rounded-br-md' : 'bg-[var(--color-bg-tertiary)] rounded-bl-md'
            )}>
              <input
                ref={editInputRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit()
                  if (e.key === 'Escape') handleCancelEdit()
                }}
                className={cn(
                  'w-full rounded-lg border-none bg-transparent px-2 py-1 text-sm outline-none',
                  isOwn ? 'text-white placeholder:text-white/60' : 'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]'
                )}
              />
              <div className="flex justify-end gap-1 px-1 pb-1">
                <button onClick={handleCancelEdit} className="rounded p-1 text-xs hover:bg-white/20">
                  <FiX size={12} />
                </button>
                <button onClick={handleSaveEdit} className="rounded bg-white/20 px-2 py-0.5 text-xs hover:bg-white/30">
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                'rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                isOwn
                  ? 'bg-primary-500 text-white rounded-br-md'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] rounded-bl-md'
              )}
              onDoubleClick={isOwner ? () => { setIsEditing(true); setEditText(message.content) } : undefined}
            >
              {linkify(message.content)}
            </div>
          )
        )}

        {reactions && reactions.length > 0 && (
          <div className={cn('flex flex-wrap gap-1 mt-1', isOwn ? 'justify-end' : 'justify-start')}>
            {reactions.map((r) => {
              const hasReacted = r.users.includes(currentUserId || '')
              return (
                <button
                  key={r.emoji}
                  onClick={() => handleReaction(r.emoji)}
                  className={cn(
                    'flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-colors',
                    hasReacted
                      ? 'border-primary-300 bg-primary-50 text-primary-700'
                      : 'border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)]'
                  )}
                >
                  <span>{r.emoji}</span>
                  <span className="text-[10px]">{r.users.length}</span>
                </button>
              )
            })}
          </div>
        )}

        <div className={cn(
          'flex items-center gap-1.5 mt-0.5',
          isOwn ? 'justify-end' : 'justify-start'
        )}>
          <span className="text-[10px] text-[var(--color-text-muted)]">
            {getRelativeTime(message.createdAt)}
          </span>
          {message.isEdited && (
            <span className="text-[10px] text-[var(--color-text-muted)]">(edited)</span>
          )}
          {message.isPinned && (
            <FiBookmark size={10} className="text-primary-500" />
          )}
          {isOwn && (
            <span className="flex items-center">
              {(() => {
                const recipientRead = message.readBy.some((id) => id !== currentUserId)
                const recipientDelivered = message.deliveredTo.some((id) => id !== currentUserId)
                if (recipientRead) return (
                  <span className="flex items-end text-blue-500" aria-label="Read">
                    <FiCheck size={11} strokeWidth={3} className="-mr-1.5" />
                    <FiCheck size={11} strokeWidth={3} />
                  </span>
                )
                if (recipientDelivered) return (
                  <span className="flex items-end text-[var(--color-text-muted)]" aria-label="Delivered">
                    <FiCheck size={11} strokeWidth={3} className="-mr-1.5" />
                    <FiCheck size={11} strokeWidth={3} />
                  </span>
                )
                return (
                  <span className="text-[var(--color-text-muted)]" aria-label="Sent">
                    <FiCheck size={11} strokeWidth={3} />
                  </span>
                )
              })()}
            </span>
          )}
        </div>

        <div
          className={cn(
            'absolute -top-8 z-10 flex items-center gap-0.5 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity',
            isOwn ? 'right-0' : 'left-0'
          )}
          onMouseEnter={handleReactionHover}
          onMouseLeave={handleReactionLeave}
        >
          {QUICK_REACTIONS.slice(0, 3).map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="rounded p-1 text-sm hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>

        <Dropdown
          trigger={
            <button className={cn(
              'absolute top-1/2 -translate-y-1/2 rounded-full bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm',
              isOwn ? '-left-8' : '-right-8'
            )}>
              <FiMoreHorizontal size={12} className="text-[var(--color-text-muted)]" />
            </button>
          }
          items={[
            { label: 'Reply', icon: <FiCornerUpLeft size={14} />, onClick: () => { onReply?.(message) } },
            { label: 'Forward', icon: <FiShare2 size={14} />, onClick: () => { onForward?.(message) } },
            { label: 'Copy', icon: <FiCopy size={14} />, onClick: handleCopy },
            { label: message.isPinned ? 'Unpin' : 'Pin', icon: <FiBookmark size={14} />, onClick: () => pinMutation.mutate() },
            ...(!isOwner ? [] : [
              { label: 'Edit', icon: <FiEdit2 size={14} />, onClick: () => setIsEditing(true) },
            ]),
            ...(!isOwner ? [] : [
              { label: 'Delete', icon: <FiTrash2 size={14} />, onClick: () => setShowDeleteDialog(true), danger: true },
            ]),
          ]}
          align={isOwn ? 'right' : 'left'}
        />

        {showDeleteDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteDialog(false)}>
            <div className="w-80 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Delete Message</h3>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">Choose how you want to delete this message.</p>
              <div className="mt-4 space-y-2">
                {isOwner && (
                  <Button
                    variant="outline"
                    fullWidth
                    size="sm"
                    onClick={() => deleteMutation.mutate(true)}
                    isLoading={deleteMutation.isPending}
                  >
                    Delete for everyone
                  </Button>
                )}
                <Button
                  variant="outline"
                  fullWidth
                  size="sm"
                  onClick={() => deleteMutation.mutate(false)}
                  isLoading={deleteMutation.isPending}
                >
                  Delete for me
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  size="sm"
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {showForwardDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForwardDialog(false)}>
            <div className="w-80 max-h-96 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4 shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Forward to</h3>
              <div className="mt-3 space-y-1">
                {conversations?.map((c) => {
                  const other = c.participants.find((p) => p._id !== currentUserId)
                  const name = c.type === 'direct' ? other?.fullName || 'Unknown' : c.name || 'Group'
                  return (
                    <button
                      key={c._id}
                      onClick={() => forwardMutation.mutate(c._id)}
                      className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm hover:bg-[var(--color-bg-hover)]"
                      disabled={forwardMutation.isPending}
                    >
                      <Avatar src={other?.profilePhoto || c.avatar} name={name} size="sm" />
                      <span className="text-[var(--color-text-primary)]">{name}</span>
                    </button>
                  )
                })}
                {(!conversations || conversations.length === 0) && (
                  <p className="text-xs text-[var(--color-text-muted)]">No conversations available</p>
                )}
              </div>
              <Button variant="ghost" fullWidth size="sm" className="mt-2" onClick={() => setShowForwardDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {isOwn && <div className="w-8 shrink-0" />}
    </div>
  )
}
