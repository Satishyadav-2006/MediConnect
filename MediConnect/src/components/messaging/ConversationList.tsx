import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch } from 'react-icons/fi'
import { Avatar, Badge } from '@/components/ui'
import { useSocket } from '@/contexts/SocketContext'
import { cn, getRelativeTime } from '@/utils'
import type { Conversation } from '@/types'

interface ConversationListProps {
  conversations: Conversation[]
  activeId?: string
  onSelect: (id: string) => void
  isLoading?: boolean
  searchPlaceholder?: string
}

export default function ConversationList({ conversations, activeId, onSelect, isLoading, searchPlaceholder = 'Search conversations...' }: ConversationListProps) {
  const [search, setSearch] = useState('')
  const { onlineUsers } = useSocket()
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = conversations.filter(c => {
    if (!search) return true
    const name = c.name || c.participants.map(p => p.fullName).join(', ')
    return name.toLowerCase().includes(search.toLowerCase())
  })

  const getConversationName = useCallback((c: Conversation) => {
    if (c.name) return c.name
    if (c.participants.length === 1) return c.participants[0]?.fullName || 'Unknown'
    return c.participants.map(p => p.fullName).join(', ')
  }, [])

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--color-border-primary)] p-3">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] py-2 pl-9 pr-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-primary-500 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3 p-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-[var(--color-bg-tertiary)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/2 rounded bg-[var(--color-bg-tertiary)]" />
                  <div className="h-2.5 w-3/4 rounded bg-[var(--color-bg-tertiary)]" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
            <FiSearch size={32} className="mb-2 opacity-40" />
            <p className="text-sm">No conversations found</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map(c => (
              <motion.button
                key={c._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => onSelect(c._id)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-bg-hover)]',
                  activeId === c._id && 'bg-primary-50 dark:bg-primary-900/20'
                )}
              >
                <Avatar
                  name={getConversationName(c)}
                  src={c.avatar || c.participants[0]?.profilePhoto}
                  size="md"
                  isOnline={c.participants.some(p => onlineUsers.has(p._id))}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                      {getConversationName(c)}
                    </span>
                    {c.lastMessage && (
                      <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                        {getRelativeTime(c.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  {c.lastMessage && (
                    <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                      {c.lastMessage.content}
                    </p>
                  )}
                </div>
                {c.unreadCount > 0 && (
                  <Badge variant="primary" size="sm">{c.unreadCount}</Badge>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
