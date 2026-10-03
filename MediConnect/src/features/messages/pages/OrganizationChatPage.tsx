import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSend, FiPaperclip, FiSearch, FiMoreVertical, FiArrowLeft, FiSmile, FiHash, FiMic, FiPlus, FiX, FiCheckSquare, FiCheck, FiVolume2 } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import { pageTransition } from '@/animations'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import Badge from '@/components/ui/Badge'
import MessageBubble from '@/components/messages/MessageBubble'
import { showSuccess, showError } from '@/components/ui/Toast'
import { formatDate, getRelativeTime, cn } from '@/utils'
import { messageService } from '@/api/messageService'
import { extractList, getNextPageParam } from '@/lib/pagination'
import type { Conversation, Message, User } from '@/types'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Channel {
  _id: string
  name: string
  type: 'channel' | 'broadcast'
  memberCount: number
  lastMessage?: Message
  unreadCount: number
}

function useOrganizationChannels(orgId: string) {
  return useInfiniteQuery({
    queryKey: ['orgChannels', orgId],
    queryFn: ({ pageParam = 1 }) => messageService.getOrganizationChannels(orgId).then((r) => r.data),
    getNextPageParam,
    initialPageParam: 1,
    enabled: !!orgId,
  })
}

function useChannelMessages(channelId: string) {
  return useInfiniteQuery({
    queryKey: ['channelMessages', channelId],
    queryFn: ({ pageParam = 1 }) => messageService.getChannelMessages(channelId, pageParam).then((r) => r.data),
    getNextPageParam,
    initialPageParam: 1,
    enabled: !!channelId,
  })
}

function useSendChannelMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ channelId, data }: { channelId: string; data: { content: string } }) =>
      messageService.sendChannelMessage(channelId, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['channelMessages', vars.channelId] })
      qc.invalidateQueries({ queryKey: ['orgChannels'] })
    },
  })
}

export default function OrganizationChatPage() {
  const { organizationId } = useParams<{ organizationId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedChannel, setSelectedChannel] = useState<string>('')
  const [messageText, setMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelType, setNewChannelType] = useState<'channel' | 'broadcast'>('channel')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'owner'

  const { data: channelsData, isLoading: loadingChannels } = useOrganizationChannels(organizationId || '')
  const { data: messagesData, isLoading: loadingMessages } = useChannelMessages(selectedChannel)
  const sendChannelMessage = useSendChannelMessage()

  const channels = useMemo(
    () => channelsData?.pages?.flatMap((p) => extractList<Channel>(p)) ?? [],
    [channelsData]
  )

  const messages = useMemo(
    () => messagesData?.pages?.flatMap((p) => extractList<Message>(p)) ?? [],
    [messagesData]
  )

  const filteredChannels = useMemo(() => {
    if (!searchQuery) return channels
    return channels.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [channels, searchQuery])

  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = []
    let currentDate = ''
    messages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt).toDateString()
      if (msgDate !== currentDate) {
        currentDate = msgDate
        groups.push({ date: msgDate, messages: [] })
      }
      groups[groups.length - 1].messages.push(msg)
    })
    return groups
  }, [messages])

  const selectedChannelData = channels.find((c) => c._id === selectedChannel)
  const isBroadcast = selectedChannelData?.type === 'broadcast'
  const canPostInBroadcast = !isBroadcast || isAdmin

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages.length, scrollToBottom])

  const handleSelectChannel = (channelId: string) => {
    setSelectedChannel(channelId)
    setMobileView('chat')
  }

  const handleBack = () => {
    setMobileView('list')
    setSelectedChannel('')
  }

  const handleSendMessage = useCallback(() => {
    if (!messageText.trim() || !selectedChannel || !canPostInBroadcast) return
    sendChannelMessage.mutate(
      { channelId: selectedChannel, data: { content: messageText.trim() } },
      {
        onSuccess: () => {
          setMessageText('')
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
          }
        },
      }
    )
  }, [messageText, selectedChannel, canPostInBroadcast, sendChannelMessage])

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

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || !organizationId) return
    try {
      await messageService.createChannel(organizationId, {
        name: newChannelName.trim(),
        type: newChannelType,
      })
      showSuccess(`${newChannelType === 'broadcast' ? 'Broadcast' : 'Channel'} created`)
      setNewChannelName('')
      setShowCreateChannel(false)
      queryClient.invalidateQueries({ queryKey: ['orgChannels', organizationId] })
    } catch {
      showError('Failed to create channel')
    }
  }

  return (
    <motion.div {...pageTransition} className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-[var(--color-border-primary)]">
      <div
        className={cn(
          'flex w-80 shrink-0 flex-col border-r border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]',
          mobileView === 'chat' && selectedChannel ? 'hidden lg:flex' : 'flex'
        )}
      >
        <div className="border-b border-[var(--color-border-primary)] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Channels</h2>
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => setShowCreateChannel(true)}>
                <FiPlus size={16} />
              </Button>
            )}
          </div>
          <Input
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<FiSearch size={14} />}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingChannels ? (
            <div className="space-y-1 p-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl p-3">
                  <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="mb-1 h-4 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6">
              <FiHash size={32} className="text-[var(--color-text-muted)] mb-2" />
              <p className="text-sm text-[var(--color-text-muted)]">No channels found</p>
            </div>
          ) : (
            filteredChannels.map((channel) => (
              <button
                key={channel._id}
                onClick={() => handleSelectChannel(channel._id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors',
                  channel._id === selectedChannel
                    ? 'bg-primary-50 border border-primary-200'
                    : 'hover:bg-[var(--color-bg-hover)] border border-transparent'
                )}
              >
                <div className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  channel.type === 'broadcast' ? 'bg-amber-100 text-amber-600' : 'bg-primary-100 text-primary-600'
                )}>
                  {channel.type === 'broadcast' ? <FiMic size={18} /> : <FiHash size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={cn(
                      'text-sm truncate',
                      channel.unreadCount > 0 ? 'font-semibold text-[var(--color-text-primary)]' : 'font-medium text-[var(--color-text-primary)]'
                    )}>
                      {channel.name}
                    </h4>
                    {channel.lastMessage && (
                      <span className="text-[10px] text-[var(--color-text-muted)] shrink-0">
                        {getRelativeTime(channel.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xs text-[var(--color-text-muted)] truncate">
                      {channel.memberCount} member{channel.memberCount !== 1 ? 's' : ''}
                      {channel.lastMessage && ` · ${channel.lastMessage.content.slice(0, 30)}`}
                    </p>
                    {channel.unreadCount > 0 && (
                      <Badge variant="primary" size="sm">
                        {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col bg-[var(--color-bg-secondary)]',
          !selectedChannel || mobileView === 'list' ? 'hidden lg:flex' : 'flex'
        )}
      >
        {!selectedChannel ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-bg-tertiary)]">
                <FiHash size={24} className="text-[var(--color-text-muted)]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">Select a channel</h3>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">Choose an organization channel to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-4 py-3">
              <div className="flex items-center gap-3">
                <button onClick={handleBack} className="mr-1 text-[var(--color-text-secondary)] lg:hidden">
                  <FiArrowLeft size={20} />
                </button>
                <div className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg',
                  isBroadcast ? 'bg-amber-100 text-amber-600' : 'bg-primary-100 text-primary-600'
                )}>
                  {isBroadcast ? <FiMic size={16} /> : <FiHash size={16} />}
                </div>
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                    {selectedChannelData?.name}
                    {isBroadcast && (
                      <Badge variant="warning" size="sm">
                        <FiMic size={10} className="mr-0.5" />
                        Broadcast
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {selectedChannelData?.memberCount || 0} member{(selectedChannelData?.memberCount || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm">
                  <FiSearch size={16} />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {isBroadcast && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                      <FiVolume2 size={16} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Broadcast Channel</p>
                      <p className="text-xs text-amber-600">Only admins and moderators can post. All members can read.</p>
                    </div>
                  </div>
                </div>
              )}
              {loadingMessages ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-64 rounded-xl" />
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
              {isBroadcast && !isAdmin ? (
                <div className="flex items-center justify-center gap-2 py-2 text-sm text-[var(--color-text-muted)]">
                  <FiMic size={14} />
                  <span>This is a broadcast channel. Only admins can post messages.</span>
                </div>
              ) : (
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
                      placeholder={isBroadcast ? 'Broadcast a message...' : `Message #${selectedChannelData?.name || ''}`}
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
                    isLoading={sendChannelMessage.isPending}
                  >
                    <FiSend size={16} />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showCreateChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreateChannel(false)}>
          <div className="w-80 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Create Channel</h3>
            <div className="mt-3 space-y-3">
              <Input
                placeholder="Channel name"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setNewChannelType('channel')}
                  className={cn(
                    'flex-1 rounded-lg border p-2 text-xs font-medium transition-colors',
                    newChannelType === 'channel'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-[var(--color-border-primary)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]'
                  )}
                >
                  <FiHash size={14} className="mr-1 inline" />
                  Channel
                </button>
                <button
                  onClick={() => setNewChannelType('broadcast')}
                  className={cn(
                    'flex-1 rounded-lg border p-2 text-xs font-medium transition-colors',
                    newChannelType === 'broadcast'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-[var(--color-border-primary)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]'
                  )}
                >
                  <FiMic size={14} className="mr-1 inline" />
                  Broadcast
                </button>
              </div>
              <div className="flex gap-2">
                <Button fullWidth size="sm" onClick={handleCreateChannel} disabled={!newChannelName.trim()}>
                  Create
                </Button>
                <Button variant="ghost" fullWidth size="sm" onClick={() => setShowCreateChannel(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
