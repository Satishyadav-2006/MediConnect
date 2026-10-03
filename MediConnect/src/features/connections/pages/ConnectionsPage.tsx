import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import { useConnections, usePendingRequests, useSuggestions, useConnectionActions } from '@/features/connections/hooks/useConnections'
import { useAuth } from '@/contexts/AuthContext'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import { Tabs, TabList, TabTrigger, TabContent } from '@/components/ui/Tabs'
import { NoConnectionsEmpty } from '@/components/empty-states'
import { formatDate } from '@/utils'
import { extractList } from '@/lib/pagination'
import type { User } from '@/types'

export default function ConnectionsPage() {
  const { user: currentUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'my_connections'
  const [searchQuery, setSearchQuery] = useState('')
  const [requestedIds, setRequestedIds] = useState<string[]>([])
  const { data: connectionsData, isLoading: loadingConnections } = useConnections()
  const { data: pendingData, isLoading: loadingPending } = usePendingRequests()
  const { data: suggestionsData, isLoading: loadingSuggestions } = useSuggestions()
  const { sendRequest, acceptRequest, rejectRequest, removeConnection } = useConnectionActions()

  const connections = (connectionsData?.pages?.flatMap(p => extractList(p)) ?? []) as { _id: string; recipient: User; requester: User; status: string }[]
  const pending = (pendingData?.pages?.flatMap(p => extractList(p)) ?? []) as { _id: string; requester: User }[]
  const suggestions = (suggestionsData?.pages?.flatMap(p => extractList<User>(p)) ?? []) as User[]

  const filteredConnections = searchQuery
    ? connections.filter(c => {
        const other = c.requester?._id === currentUser?._id ? c.recipient : c.recipient?._id === currentUser?._id ? c.requester : c.recipient
        return other?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
      })
    : connections

  const ConnectionSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-center justify-between rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div>
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  )

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Connections</h1>
        <span className="text-sm text-[var(--color-text-muted)]">{connections.length} total</span>
      </div>

      <Tabs defaultValue={initialTab} onValueChange={(value) => setSearchParams({ tab: value }, { replace: true })}>
        <TabList>
          <TabTrigger value="my_connections">My Connections</TabTrigger>
          <TabTrigger value="pending">Pending ({pending.length})</TabTrigger>
          <TabTrigger value="suggestions">Suggestions</TabTrigger>
        </TabList>

        <TabContent value="my_connections">
          <div className="mb-4">
            <Input
              placeholder="Search connections..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              leftIcon={<span className="text-[var(--color-text-muted)]">🔍</span>}
            />
          </div>
          {loadingConnections ? (
            <ConnectionSkeleton />
          ) : filteredConnections.length === 0 ? (
            <NoConnectionsEmpty />
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
              {filteredConnections.map(conn => {
                const other = conn.requester?._id === currentUser?._id ? conn.recipient : conn.recipient?._id === currentUser?._id ? conn.requester : conn.recipient
                if (!other) return null
                return (
                  <motion.div key={conn._id} variants={staggerItem} className="flex items-center justify-between rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
                    <Link to={`/profile/${other.username || other._id}`} className="flex items-center gap-3">
                      <Avatar src={other.profilePhoto} name={other.fullName || 'User'} />
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{other.fullName || 'User'}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{other.headline || other.specialization || 'Healthcare Professional'}</p>
                      </div>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => removeConnection.mutate(conn._id)} isLoading={removeConnection.isPending}>
                      Remove
                    </Button>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </TabContent>

        <TabContent value="pending">
          {loadingPending ? (
            <ConnectionSkeleton />
          ) : pending.length === 0 ? (
            <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-8 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">No pending requests</p>
            </div>
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
              {pending.map(conn => {
                if (!conn.requester) return null
                return (
                  <motion.div key={conn._id} variants={staggerItem} className="flex items-center justify-between rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
                    <Link to={`/profile/${conn.requester.username || conn.requester._id}`} className="flex items-center gap-3">
                      <Avatar src={conn.requester.profilePhoto} name={conn.requester.fullName || 'User'} />
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{conn.requester.fullName || 'User'}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">Sent {formatDate(new Date().toISOString())}</p>
                      </div>
                    </Link>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => acceptRequest.mutate(conn._id)} isLoading={acceptRequest.isPending}>Accept</Button>
                    <Button variant="ghost" size="sm" onClick={() => rejectRequest.mutate(conn._id)} isLoading={rejectRequest.isPending}>Decline</Button>
                  </div>
                </motion.div>
                )
              })}
            </motion.div>
          )}
        </TabContent>

        <TabContent value="suggestions">
          {loadingSuggestions ? (
            <ConnectionSkeleton />
          ) : suggestions.length === 0 ? (
            <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-8 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">No suggestions available right now</p>
            </div>
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
              {suggestions.filter(user => user && user._id !== currentUser?._id).map(user => {
                return (
                  <motion.div key={user._id} variants={staggerItem} className="flex items-center justify-between rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
                    <Link to={`/profile/${user.username}`} className="flex items-center gap-3">
                      <Avatar src={user.profilePhoto} name={user.fullName} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{user.fullName}</p>
                          {user.accountStatus === 'active' && <Badge variant="primary" size="sm">Verified</Badge>}
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)]">{user.headline || user.specialization}</p>
                      </div>
                    </Link>
                    <Button
                      size="sm"
                      variant={requestedIds.includes(user._id) ? 'ghost' : 'outline'}
                      disabled={requestedIds.includes(user._id)}
                      isLoading={sendRequest.isPending}
                      onClick={() => sendRequest.mutate(user._id, {
                        onSuccess: () => setRequestedIds(ids => [...ids, user._id]),
                      })}
                    >
                      {requestedIds.includes(user._id) ? 'Requested' : 'Connect'}
                    </Button>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </TabContent>
      </Tabs>
    </motion.div>
  )
}
