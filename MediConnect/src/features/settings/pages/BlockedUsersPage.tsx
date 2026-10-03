import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsService } from '@/api/settingsService'
import { extractList } from '@/lib/pagination'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import Avatar from '@/components/ui/Avatar'
import { FiSearch, FiUserX } from 'react-icons/fi'

interface BlockedUser {
  _id: string
  user: {
    _id: string
    fullName: string
    profilePhoto?: string
    headline?: string
  }
  blockedAt: string
}

export default function BlockedUsersPage() {
  const [search, setSearch] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['blockedUsers'],
    queryFn: () => settingsService.getBlockedUsers(1, 100).then(r => r.data),
  })

  const unblockMutation = useMutation({
    mutationFn: (userId: string) => settingsService.unblockUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blockedUsers'] })
      toast.success('User unblocked')
    },
    onError: () => toast.error('Failed to unblock user'),
  })

  const users = extractList<BlockedUser>(data)
  const filtered = search
    ? users.filter(u => u.user?.fullName?.toLowerCase().includes(search.toLowerCase()))
    : users

  const handleUnblock = (userId: string, name: string) => {
    if (window.confirm(`Are you sure you want to unblock ${name}?`)) {
      unblockMutation.mutate(userId)
    }
  }

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Blocked Users</h1>

      <div className="relative">
        <FiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search blocked users..."
          className="w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] pl-10 pr-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <FiUserX size={48} className="text-[var(--color-text-muted)]" />
          <h2 className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
            {search ? 'No users found' : 'No blocked users'}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {search ? 'Try a different search term.' : 'You haven\'t blocked anyone yet.'}
          </p>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
          {filtered.map(blocked => (
            <motion.div key={blocked._id} variants={staggerItem} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={blocked.user?.fullName} src={blocked.user?.profilePhoto} size="md" />
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{blocked.user?.fullName}</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">{blocked.user?.headline || 'MediConnect member'}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnblock(blocked.user?._id, blocked.user?.fullName)}
                  disabled={unblockMutation.isPending}
                >
                  Unblock
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
