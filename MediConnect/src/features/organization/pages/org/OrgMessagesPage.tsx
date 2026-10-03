import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/utils'
import { FiHash, FiPlus, FiClock } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { channelService, type Channel, type ChannelMessage } from '@/api/channelService'
import { useAuth } from '@/contexts/AuthContext'
import { useCurrentOrganizationContext } from '@/features/organization/context/CurrentOrganizationContext'
import EmptyState from '@/components/ui/EmptyState'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import Avatar from '@/components/ui/Avatar'
import { formatDateTime } from '@/utils'
import { extractList } from '@/lib/pagination'

function OrgChannelList({
  channels,
  selectedId,
  onSelect,
  loading,
}: {
  channels: Channel[]
  selectedId: string | null
  onSelect: (id: string) => void
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
      </div>
    )
  }
  if (channels.length === 0) {
    return <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">No channels yet. Create one to get started.</p>
  }
  return (
    <ul className="space-y-1.5">
      {channels.map(channel => (
        <li key={channel._id}>
          <button
            onClick={() => onSelect(channel._id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
              selectedId === channel._id
                ? 'bg-primary-500/10 text-primary-500'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
            )}
          >
            <FiHash size={16} />
            <span className="truncate font-medium">{channel.name}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export default function OrgMessagesPage() {
  const { orgId } = useCurrentOrganizationContext()
  const { user } = useAuth()
  const qc = useQueryClient()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [channelName, setChannelName] = useState('')
  const [channelDesc, setChannelDesc] = useState('')
  const [draft, setDraft] = useState('')

  const { data: channelsData, isLoading: channelsLoading } = useQuery({
    queryKey: ['orgChannels', orgId],
    queryFn: () => channelService.listChannels().then(r => r.data),
  })
  const allChannels = extractList<Channel>(channelsData)
  const orgChannels = allChannels.filter(c => c.organization_id === orgId)

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['orgChannelMessages', selectedId],
    queryFn: () => channelService.getChannelMessages(selectedId!).then(r => r.data),
    enabled: !!selectedId,
    refetchInterval: 8000,
  })
  const messages = extractList<ChannelMessage>(messagesData).slice().reverse()

  const createMutation = useMutation({
    mutationFn: () => channelService.createChannel({ name: channelName, description: channelDesc, organization_id: orgId }),
    onSuccess: () => {
      toast.success('Channel created')
      setChannelName(''); setChannelDesc(''); setShowCreate(false)
      qc.invalidateQueries({ queryKey: ['orgChannels', orgId] })
    },
    onError: () => toast.error('Failed to create channel'),
  })

  const sendMutation = useMutation({
    mutationFn: () => channelService.sendChannelMessage(selectedId!, draft),
    onSuccess: () => {
      setDraft('')
      qc.invalidateQueries({ queryKey: ['orgChannelMessages', selectedId] })
    },
    onError: () => toast.error('Failed to send message'),
  })

  const selectedChannel = orgChannels.find(c => c._id === selectedId) ?? null

  return (
    <div className="grid h-[calc(100vh-10rem)] grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
      <section className="flex flex-col overflow-hidden rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Channels</h2>
          <Button size="sm" variant="ghost" onClick={() => setShowCreate(p => !p)} leftIcon={<FiPlus size={14} />}>New</Button>
        </div>

        {showCreate && (
          <form
            onSubmit={(e) => { e.preventDefault(); if (channelName.trim()) createMutation.mutate() }}
            className="space-y-3 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] p-3"
          >
            <Input label="Channel name" placeholder="e.g. general" value={channelName} onChange={(e) => setChannelName(e.target.value)} required />
            <Input label="Description" placeholder="What is this channel for?" value={channelDesc} onChange={(e) => setChannelDesc(e.target.value)} />
            <div className="flex justify-end">
              <Button type="submit" size="sm" isLoading={createMutation.isPending} disabled={!channelName.trim()}>Create</Button>
            </div>
          </form>
        )}

        <div className="flex-1 overflow-y-auto p-3">
          <OrgChannelList channels={orgChannels} selectedId={selectedId} onSelect={setSelectedId} loading={channelsLoading} />
        </div>
      </section>

      <section className="flex flex-col overflow-hidden rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]">
        {!selectedChannel ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState
              variant="compact"
              icon={<FiHash size={24} />}
              title="Select a channel"
              description="Org channels are shared with your team's members. Create a channel, then select it to start messaging."
            />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 border-b border-[var(--color-border-primary)] px-4 py-3">
              <FiHash size={16} className="text-primary-500" />
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{selectedChannel.name}</h2>
              {selectedChannel.description && <span className="ml-2 hidden truncate text-xs text-[var(--color-text-muted)] sm:block">{selectedChannel.description}</span>}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messagesLoading ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-2/3 rounded-lg" />)}</div>
              ) : messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">No messages yet. Start the conversation!</p>
              ) : (
                messages.map(message => {
                  const isOwn = message.sender_id === (user?._id as string)
                  return (
                    <div key={message._id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                      <div className={cn('max-w-[75%] rounded-2xl px-4 py-2.5', isOwn ? 'bg-primary-500 text-white' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]')}>
                        {!isOwn && (
                          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-text-muted)]">
                            <Avatar src="" name={message.sender_id} size="xs" />
                            <span className="max-w-[10rem] truncate">{message.sender_id}</span>
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        <p className={cn('mt-1 flex items-center gap-1 text-[10px]', isOwn ? 'text-white/70' : 'text-[var(--color-text-muted)]')}>
                          <FiClock size={10} />{formatDateTime(message.created_at || '') || ''}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); if (draft.trim() && selectedId) sendMutation.mutate() }}
              className="flex items-center gap-2 border-t border-[var(--color-border-primary)] p-3"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Message #${selectedChannel.name}`}
                className="flex-1 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-primary-500"
              />
              <Button type="submit" size="sm" isLoading={sendMutation.isPending} disabled={!draft.trim() || !selectedId}>Send</Button>
            </form>
          </>
        )}
      </section>
    </div>
  )
}