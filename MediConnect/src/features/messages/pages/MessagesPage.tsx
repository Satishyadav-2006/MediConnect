import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSend, FiPaperclip, FiSearch, FiMoreVertical, FiFile, FiArrowLeft, FiSmile, FiBookmark, FiImage, FiX, FiCheckSquare } from 'react-icons/fi'
import { useConversations, useMessages, useSendMessage, useMarkAsRead } from '@/features/messages/hooks/useMessages'
import { useAuth } from '@/contexts/AuthContext'
import { pageTransition } from '@/animations'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import Badge from '@/components/ui/Badge'
import Dropdown from '@/components/ui/Dropdown'
import { Tabs, TabList, TabTrigger, TabContent } from '@/components/ui/Tabs'
import ConversationCard from '@/components/messages/ConversationCard'
import MessageBubble from '@/components/messages/MessageBubble'
import TypingIndicator from '@/components/messages/TypingIndicator'
import { NoMessagesEmpty } from '@/components/empty-states'
import { MessageSkeleton } from '@/components/skeletons'
import { formatDate, getRelativeTime, cn, truncateText, isUserOnline } from '@/utils'
import { messageService } from '@/api/messageService'
import { extractList } from '@/lib/pagination'
import { showSuccess, showError } from '@/components/ui/Toast'
import type { Conversation, Message } from '@/types'

export default function MessagesPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedConvo, setSelectedConvo] = useState<string>(conversationId || '')
  const [messageText, setMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInChat, setSearchInChat] = useState('')
  const [showSearchInChat, setShowSearchInChat] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [sharedFiles, setSharedFiles] = useState<{ _id: string; fileName: string; fileUrl: string; type: string; createdAt: string }[]>([])
  const [showRightPanel, setShowRightPanel] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const [pinnedMessagesData, setPinnedMessagesData] = useState<Message[]>([])
  const [showPinnedPanel, setShowPinnedPanel] = useState(false)
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const { data: convosData, isLoading: loadingConvos } = useConversations()
  const { data: messagesData, isLoading: loadingMessages } = useMessages(selectedConvo)
  const sendMessage = useSendMessage()
  const markAsRead = useMarkAsRead(selectedConvo)

  const conversations = useMemo(
    () => convosData?.pages?.flatMap((p) => extractList<Conversation>(p)) ?? [],
    [convosData]
  )
  const messages = useMemo(
    () =>
      [...(messagesData?.pages?.flatMap((p) => extractList<Message>(p)) ?? [])]
        .reverse()
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messagesData]
  )

  const filteredConvos = useMemo(() => {
    let list = conversations
    if (activeFilter === 'unread') list = list.filter((c) => c.unreadCount > 0)
    if (searchQuery) {
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.participants.some((p) => p.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }
    return list
  }, [conversations, searchQuery, activeFilter])

  const selectedConvoData = conversations.find((c) => c._id === selectedConvo)
  const otherParticipant = selectedConvoData?.participants.find((p) => p._id !== user?._id)
  const isDirectChat = selectedConvoData?.type === 'direct'
  const headerName = isDirectChat
    ? otherParticipant?.fullName || 'Unknown'
    : selectedConvoData?.name || 'Group Chat'
  const headerPhoto = isDirectChat
    ? otherParticipant?.profilePhoto
    : selectedConvoData?.avatar

  const filteredMessages = useMemo(() => {
    if (!searchInChat) return messages
    return messages.filter((m) => m.content.toLowerCase().includes(searchInChat.toLowerCase()))
  }, [messages, searchInChat])

  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = []
    let currentDate = ''
    filteredMessages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt).toDateString()
      if (msgDate !== currentDate) {
        currentDate = msgDate
        groups.push({ date: msgDate, messages: [] })
      }
      groups[groups.length - 1].messages.push(msg)
    })
    return groups
  }, [filteredMessages])

  const lastReadMessage = useMemo(() => {
    if (!messages.length) return null
    const sorted = [...messages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return sorted.find((m) => m.readBy.length > 1 && m.sender._id === user?._id) || null
  }, [messages, user?._id])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages.length, scrollToBottom])

  useEffect(() => {
    if (conversationId) {
      setSelectedConvo(conversationId)
      setMobileView('chat')
    }
  }, [conversationId])

  useEffect(() => {
    if (selectedConvo) {
      messageService.getPinnedMessages(selectedConvo).then((res) => {
        setPinnedMessagesData(extractList<Message>(res.data))
      }).catch(() => setPinnedMessagesData([]))
      markAsRead.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConvo, messages])

  const handleSelectConvo = (convoId: string) => {
    setSelectedConvo(convoId)
    setMobileView('chat')
    navigate(`/messages/${convoId}`, { replace: true })
  }

  const handleBack = () => {
    setMobileView('list')
    setSelectedConvo('')
    navigate('/messages', { replace: true })
  }

  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || !selectedConvo) return
    const content = messageText.trim()
    setMessageText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    try {
      await sendMessage.mutateAsync({ conversationId: selectedConvo, data: { content } })
    } catch { /* handled by mutation */ }
  }, [messageText, selectedConvo, sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
  }

  const loadSharedFiles = async () => {
    if (!selectedConvo) return
    try {
      const res = await messageService.getSharedFiles(selectedConvo)
      setSharedFiles(extractList(res.data))
      setShowRightPanel(true)
    } catch {
      /* handled */
    }
  }

  return (
    <motion.div {...pageTransition} className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-[var(--color-border-primary)]">
      <div
        className={cn(
          'flex w-80 shrink-0 flex-col border-r border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]',
          mobileView === 'chat' && selectedConvo ? 'hidden lg:flex' : 'flex'
        )}
      >
        <div className="border-b border-[var(--color-border-primary)] p-4">
          <h2 className="mb-3 text-lg font-bold text-[var(--color-text-primary)]">Messages</h2>
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<FiSearch size={14} />}
          />
        </div>

        <div className="flex border-b border-[var(--color-border-primary)] px-4 pt-2">
          {(['all', 'unread'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={cn(
                'mr-4 border-b-2 pb-2 text-xs font-medium capitalize transition-colors',
                activeFilter === tab
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 border-b border-[var(--color-border-primary)] px-4 py-2.5">
          <div className="flex -space-x-2">
            {conversations
              .filter((c) => {
                const other = c.participants.find((p) => p._id !== user?._id)
                return isUserOnline(other)
              })
              .slice(0, 5)
              .map((c) => {
                const other = c.participants.find((p) => p._id !== user?._id)
                return (
                  <div key={c._id} className="relative">
                    <Avatar src={other?.profilePhoto} name={other?.fullName || ''} size="sm" className="h-7 w-7 border-2 border-[var(--color-bg-primary)]" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-bg-primary)] bg-green-400" />
                  </div>
                )
              })}
          </div>
          <span className="text-[10px] text-[var(--color-text-muted)]">Online</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvos ? (
            <div className="space-y-1 p-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl p-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="mb-1 h-4 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConvos.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6">
              <NoMessagesEmpty />
            </div>
          ) : (
            filteredConvos.map((convo) => (
              <ConversationCard
                key={convo._id}
                conversation={convo}
                isActive={convo._id === selectedConvo}
                currentUserId={user?._id}
                onClick={() => handleSelectConvo(convo._id)}
              />
            ))
          )}
        </div>
      </div>

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col bg-[var(--color-bg-secondary)]',
          !selectedConvo || mobileView === 'list' ? 'hidden lg:flex' : 'flex'
        )}
      >
        {!selectedConvo ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-bg-tertiary)]">
                <FiSend size={24} className="text-[var(--color-text-muted)]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">Select a conversation</h3>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">Choose from your existing conversations or start a new one</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-4 py-3">
              <div className="flex items-center gap-3">
                <button onClick={handleBack} className="mr-1 text-[var(--color-text-secondary)] lg:hidden">
                  <FiArrowLeft size={20} />
                </button>
                <Avatar src={headerPhoto} name={headerName} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{headerName}</p>
                  <p className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                    {isDirectChat ? (
                      otherParticipant?.accountStatus === 'active' && isUserOnline(otherParticipant) ? (
                        <>
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
                          Online
                        </>
                      ) : (
                        <span>Last seen {getRelativeTime(otherParticipant?.updatedAt || '')}</span>
                      )
                    ) : (
                      <span>{selectedConvoData?.participants.length || 0} members</span>
                    )}
                    {lastReadMessage && (
                      <span className="ml-2 flex items-center gap-1">
                        <FiCheckSquare size={10} className="text-blue-500" />
                        Read {getRelativeTime(lastReadMessage.updatedAt)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearchInChat(!showSearchInChat)}
                  className={cn(showSearchInChat && 'bg-[var(--color-bg-tertiary)]')}
                >
                  <FiSearch size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPinnedPanel(!showPinnedPanel)}
                  className={cn(showPinnedPanel && 'bg-[var(--color-bg-tertiary)]')}
                >
                  <FiBookmark size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={loadSharedFiles}>
                  <FiPaperclip size={16} />
                </Button>
                <Dropdown
                  trigger={
                    <Button variant="ghost" size="sm">
                      <FiMoreVertical size={16} />
                    </Button>
                  }
                  items={[
                    { label: 'View Profile', icon: <FiSearch size={14} />, onClick: () => {} },
                    { label: 'Mute Notifications', icon: <FiX size={14} />, onClick: () => {} },
                    { label: 'Delete Conversation', icon: <FiX size={14} />, onClick: () => {}, danger: true },
                  ]}
                />
              </div>
            </div>

            <AnimatePresence>
              {showSearchInChat && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-4 py-2"
                >
                  <Input
                    placeholder="Search in conversation..."
                    value={searchInChat}
                    onChange={(e) => setSearchInChat(e.target.value)}
                    leftIcon={<FiSearch size={14} />}
                    rightIcon={
                      searchInChat ? (
                        <button onClick={() => setSearchInChat('')}>
                          <FiX size={14} />
                        </button>
                      ) : undefined
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showPinnedPanel && pinnedMessagesData.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-[var(--color-border-primary)] bg-primary-50 px-4 py-2"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-xs text-primary-700">
                      <FiBookmark size={12} />
                      <span className="font-medium">Pinned Messages ({pinnedMessagesData.length})</span>
                    </div>
                    <button onClick={() => setShowPinnedPanel(false)} className="text-primary-500 hover:text-primary-700">
                      <FiX size={12} />
                    </button>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {pinnedMessagesData.map((pm) => (
                      <div key={pm._id} className="rounded-lg bg-white/60 px-2 py-1 text-xs text-primary-800">
                        <span className="font-medium">{pm.sender.fullName}:</span> {truncateText(pm.content, 80)}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {pinnedMessagesData.length > 0 && !showPinnedPanel && (
              <div className="border-b border-[var(--color-border-primary)] bg-primary-50 px-4 py-2">
                <button
                  onClick={() => setShowPinnedPanel(true)}
                  className="flex items-center gap-1.5 text-xs text-primary-700 hover:text-primary-900"
                >
                  <FiBookmark size={12} />
                  <span className="font-medium">{pinnedMessagesData.length} pinned message{pinnedMessagesData.length > 1 ? 's' : ''}</span>
                  <span className="mx-1 text-primary-300">·</span>
                  <span className="truncate">{pinnedMessagesData[0].content}</span>
                </button>
              </div>
            )}

            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4">
              {loadingMessages ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <MessageSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {groupedMessages.map((group) => (
                    <div key={group.date}>
                      <div className="my-4 flex items-center gap-3">
                        <div className="h-px flex-1 bg-[var(--color-border-primary)]" />
                        <span className="text-[10px] font-medium text-[var(--color-text-muted)]">
                          {formatDate(group.messages[0]?.createdAt || '')}
                        </span>
                        <div className="h-px flex-1 bg-[var(--color-border-primary)]" />
                      </div>

                      {group.messages.map((msg, idx) => {
                        const prev = group.messages[idx - 1]
                        const showAvatar = !prev || prev.sender._id !== msg.sender._id
                        return (
                          <motion.div
                            key={msg._id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-1"
                          >
                            <MessageBubble
                              message={msg}
                              isOwn={msg.sender._id === user?._id}
                              showAvatar={showAvatar}
                              currentUserId={user?._id}
                              conversations={conversations}
                              onForward={(m) => setForwardMessage(m)}
                            />
                          </motion.div>
                        )
                      })}
                    </div>
                  ))}
                </AnimatePresence>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-3">
              <div className="flex items-end gap-2">
                <Button variant="ghost" size="sm" className="shrink-0">
                  <FiPaperclip size={18} />
                </Button>
                <Button variant="ghost" size="sm" className="shrink-0">
                  <FiSmile size={18} />
                </Button>
                <div className="relative flex-1">
                  <textarea
                    ref={textareaRef}
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={handleTextareaInput}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    className="w-full resize-none rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <Button
                  size="sm"
                  className="shrink-0"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  isLoading={sendMessage.isPending}
                >
                  <FiSend size={16} />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {showRightPanel && selectedConvo && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden shrink-0 overflow-hidden border-l border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] lg:block"
          >
            <div className="h-full w-[300px] overflow-y-auto p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Conversation Info</h3>
                <button
                  onClick={() => setShowRightPanel(false)}
                  className="rounded-lg p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
                >
                  <FiX size={14} />
                </button>
              </div>

              <div className="flex flex-col items-center rounded-xl border border-[var(--color-border-primary)] p-5">
                <Avatar src={otherParticipant?.profilePhoto} name={otherParticipant?.fullName || ''} size="lg" />
                <h4 className="mt-3 text-sm font-semibold text-[var(--color-text-primary)]">{otherParticipant?.fullName}</h4>
                <p className="text-xs text-[var(--color-text-muted)]">{otherParticipant?.headline || otherParticipant?.specialization || ''}</p>
                {otherParticipant?.currentOrganization?.name && (
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{otherParticipant.currentOrganization.name}</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  className="mt-3"
                  onClick={() => navigate(`/profile/${otherParticipant?.username}`)}
                >
                  View Profile
                </Button>
              </div>

              <div className="mt-4 rounded-xl border border-[var(--color-border-primary)] p-4">
                <h4 className="mb-2 text-xs font-semibold uppercase text-[var(--color-text-muted)]">Shared Images</h4>
                <div className="grid grid-cols-3 gap-1">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-lg bg-[var(--color-bg-tertiary)]">
                      <Skeleton className="h-full w-full" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-[var(--color-border-primary)] p-4">
                <h4 className="mb-2 text-xs font-semibold uppercase text-[var(--color-text-muted)]">Shared Files</h4>
                {sharedFiles.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-muted)]">No shared files</p>
                ) : (
                  <div className="space-y-2">
                    {sharedFiles.slice(0, 5).map((file) => (
                      <a
                        key={file._id}
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg p-2 hover:bg-[var(--color-bg-hover)]"
                      >
                        <FiFile size={14} className="shrink-0 text-primary-500" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-[var(--color-text-primary)]">{file.fileName}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)]">{formatDate(file.createdAt)}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {forwardMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setForwardMessage(null)}>
          <div className="w-80 max-h-96 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4 shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Forward message</h3>
            <p className="mt-1 text-xs text-[var(--color-text-muted)] truncate">"{forwardMessage.content}"</p>
            <div className="mt-3 space-y-1 max-h-60 overflow-y-auto">
              {conversations.map((c) => {
                const other = c.participants.find((p) => p._id !== user?._id)
                const name = c.type === 'direct' ? other?.fullName || 'Unknown' : c.name || 'Group'
                return (
                  <button
                    key={c._id}
                    onClick={async () => {
                      try {
                        await messageService.forwardMessage(forwardMessage._id, c._id)
                        showSuccess('Message forwarded')
                        setForwardMessage(null)
                      } catch {
                        showError('Failed to forward')
                      }
                    }}
                    className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm hover:bg-[var(--color-bg-hover)]"
                  >
                    <Avatar src={other?.profilePhoto || c.avatar} name={name} size="sm" />
                    <span className="text-[var(--color-text-primary)]">{name}</span>
                  </button>
                )
              })}
            </div>
            <Button variant="ghost" fullWidth size="sm" className="mt-2" onClick={() => setForwardMessage(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
