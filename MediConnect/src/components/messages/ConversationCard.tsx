import { cn, getRelativeTime, truncateText, isUserOnline } from '@/utils'
import type { Conversation } from '@/types'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'

interface ConversationCardProps {
  conversation: Conversation
  isActive: boolean
  currentUserId?: string
  onClick?: () => void
}

export default function ConversationCard({ conversation, isActive, currentUserId, onClick }: ConversationCardProps) {
  const otherParticipant = conversation.participants.find(p => p._id !== currentUserId)
  const displayName = conversation.type === 'direct'
    ? otherParticipant?.fullName || 'Unknown'
    : conversation.name || 'Group Chat'
  const displayPhoto = conversation.type === 'direct'
    ? otherParticipant?.profilePhoto
    : conversation.avatar
  const isOnline = conversation.type === 'direct' && isUserOnline(otherParticipant)

  const lastMessagePreview = conversation.lastMessage
    ? conversation.lastMessage.type === 'image'
      ? '📷 Image'
      : conversation.lastMessage.type === 'file'
        ? '📎 File'
        : truncateText(conversation.lastMessage.content, 50)
    : 'No messages yet'

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors',
        isActive
          ? 'bg-primary-50 border border-primary-200'
          : 'hover:bg-[var(--color-bg-hover)] border border-transparent'
      )}
    >
      <Avatar
        src={displayPhoto}
        name={displayName}
        size="md"
        isOnline={isOnline}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className={cn(
            'text-sm truncate',
            conversation.unreadCount > 0 ? 'font-semibold text-[var(--color-text-primary)]' : 'font-medium text-[var(--color-text-primary)]'
          )}>
            {displayName}
          </h4>
          {conversation.lastMessage && (
            <span className="text-[10px] text-[var(--color-text-muted)] shrink-0">
              {getRelativeTime(conversation.lastMessage.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={cn(
            'text-xs truncate',
            conversation.unreadCount > 0 ? 'text-[var(--color-text-primary)] font-medium' : 'text-[var(--color-text-muted)]'
          )}>
            {conversation.lastMessage?.sender && conversation.lastMessage.sender._id === currentUserId && (
              <span className="text-[var(--color-text-muted)]">You: </span>
            )}
            {lastMessagePreview}
          </p>
          {conversation.unreadCount > 0 && (
            <Badge variant="primary" size="sm">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  )
}
