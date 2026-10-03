import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSend, FiPaperclip, FiSmile, FiMoreVertical, FiArrowLeft, FiCheck } from 'react-icons/fi'
import { Avatar } from '@/components/ui'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'
import { cn, getRelativeTime } from '@/utils'
import type { Conversation, Message } from '@/types'

interface ChatWindowProps {
  conversation: Conversation
  messages: Message[]
  onSendMessage: (content: string) => void
  onBack?: () => void
  isLoading?: boolean
}

export default function ChatWindow({ conversation, messages, onSendMessage, onBack, isLoading }: ChatWindowProps) {
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { onlineUsers, sendMessage } = useSocket()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text) return
    onSendMessage(text)
    setInput('')
    sendMessage({ type: 'typing_stop', payload: { conversation_id: conversation._id } })
  }, [input, onSendMessage, sendMessage, conversation._id])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    if (!isTyping) {
      setIsTyping(true)
      sendMessage({ type: 'typing_start', payload: { conversation_id: conversation._id } })
      setTimeout(() => setIsTyping(false), 2000)
    }
  }

  const otherUser = conversation.participants.find(p => p._id !== user?._id)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-[var(--color-border-primary)] px-4 py-3">
        {onBack && (
          <button onClick={onBack} className="rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]">
            <FiArrowLeft size={20} />
          </button>
        )}
        <Avatar
          name={otherUser?.fullName || conversation.name || 'Chat'}
          src={otherUser?.profilePhoto || conversation.avatar}
          size="sm"
          isOnline={otherUser ? onlineUsers.has(otherUser._id) : false}
        />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            {conversation.name || otherUser?.fullName || 'Chat'}
          </h3>
          {otherUser && (
            <p className="text-xs text-[var(--color-text-muted)]">
              {onlineUsers.has(otherUser._id) ? 'Online' : 'Offline'}
            </p>
          )}
        </div>
        <button className="rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]">
          <FiMoreVertical size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={cn('flex animate-pulse', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
                <div className={cn('h-8 rounded-2xl', i % 2 === 0 ? 'w-48 bg-[var(--color-bg-tertiary)]' : 'w-36 bg-primary-100')} />
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence>
            {messages.map(msg => {
              const isMe = msg.sender?._id === user?._id
              return (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('flex', isMe ? 'justify-end' : 'justify-start')}
                >
                  <div className={cn(
                    'max-w-[70%] rounded-2xl px-4 py-2',
                    isMe
                      ? 'bg-primary-500 text-white rounded-br-md'
                      : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] rounded-bl-md'
                  )}>
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className={cn('mt-1 flex items-center gap-1 text-[10px]', isMe ? 'text-white/70' : 'text-[var(--color-text-muted)]')}>
                      <span>{getRelativeTime(msg.createdAt)}</span>
                      {isMe && <FiCheck size={12} />}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-[var(--color-border-primary)] px-4 py-3">
        <div className="flex items-end gap-2">
          <button className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-secondary)]">
            <FiPaperclip size={20} />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full resize-none rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-primary-500 focus:outline-none"
            />
          </div>
          <button className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-secondary)]">
            <FiSmile size={20} />
          </button>
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="rounded-xl bg-primary-500 p-2.5 text-white transition-colors hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSend size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
