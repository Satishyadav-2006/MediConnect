import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiLink2, FiTwitter, FiFacebook, FiLinkedin, FiCopy, FiCheck, FiSearch, FiGlobe, FiSend } from 'react-icons/fi'
import { Modal } from '@/components/ui'
import Avatar from '@/components/ui/Avatar'
import { copyToClipboard } from '@/utils'
import { extractList } from '@/lib/pagination'
import { showSuccess, showError } from '@/components/ui/Toast'
import { connectionService } from '@/api/connectionService'
import { messageService } from '@/api/messageService'
import { postService } from '@/api/postService'
import { useAuth } from '@/contexts/AuthContext'
import type { User } from '@/types'

interface ShareDialogProps {
  isOpen: boolean
  onClose: () => void
  url: string
  title?: string
  postId?: string
}

interface ConnectionDoc {
  _id: string
  requester: User
  recipient: User
  status: string
}

export default function ShareDialog({ isOpen, onClose, url, title, postId }: ShareDialogProps) {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<User | null>(null)
  const [note, setNote] = useState('')

  const handleCopy = async () => {
    await copyToClipboard(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const { data: connectionsData, isLoading: loadingConnections } = useQuery({
    queryKey: ['connections', 'share-picker'],
    queryFn: () => connectionService.getMyConnections(1, 100).then(r => r.data),
    enabled: isOpen && !!postId,
  })

  const contacts = useMemo(() => {
    const docs = extractList<ConnectionDoc>(connectionsData)
    return docs
      .map(d => (d.requester?._id === currentUser?._id ? d.recipient : d.requester))
      .filter((u): u is User => !!u && !!u._id)
      .filter(u => {
        const q = query.trim().toLowerCase()
        if (!q) return true
        return u.fullName?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q)
      })
  }, [connectionsData, currentUser, query])

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selected || !postId) return
      const content = note.trim() ? `${note.trim()}\n\n${url}` : `Check out this post:\n${url}`
      await messageService.sendDirectMessage(selected._id, content)
      await postService.sharePost(postId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      showSuccess(`Shared with ${selected?.fullName || 'your connection'}`)
      setSelected(null)
      setNote('')
      setQuery('')
      onClose()
    },
    onError: () => showError('Failed to share'),
  })

  const feedMutation = useMutation({
    mutationFn: async () => {
      if (!postId) return
      await postService.sharePost(postId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      showSuccess('Shared to your feed')
      onClose()
    },
    onError: () => showError('Failed to share'),
  })

  const shareLinks = [
    { label: 'Copy Link', icon: copied ? <FiCheck size={18} /> : <FiLink2 size={18} />, onClick: handleCopy },
    { label: 'Twitter', icon: <FiTwitter size={18} />, onClick: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title || '')}`, '_blank') },
    { label: 'Facebook', icon: <FiFacebook size={18} />, onClick: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank') },
    { label: 'LinkedIn', icon: <FiLinkedin size={18} />, onClick: () => window.open(`https://www.linkedin.com/shareArticle?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title || '')}`, '_blank') },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share" size="sm">
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border-primary)] p-3">
            <FiLink2 size={16} className="shrink-0 text-[var(--color-text-muted)]" />
            <p className="flex-1 truncate text-sm text-[var(--color-text-secondary)]">{url}</p>
            <button onClick={handleCopy} className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]">
              {copied ? <FiCheck size={16} className="text-accent-500" /> : <FiCopy size={16} />}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            {shareLinks.map(link => (
              <button
                key={link.label}
                onClick={link.onClick}
                className="flex items-center gap-2 rounded-lg border border-[var(--color-border-primary)] p-3 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-hover)]"
              >
                {link.icon}
                {link.label}
              </button>
            ))}
          </div>
        </div>

        {postId && (
          <div className="space-y-3 border-t border-[var(--color-border-primary)] pt-4">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Send to a connection</p>
            <div className="relative">
              <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search connections..."
                className="w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] py-2 pl-9 pr-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {loadingConnections ? (
                <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">Loading connections...</p>
              ) : contacts.length === 0 ? (
                <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">No connections found</p>
              ) : (
                contacts.map(u => (
                  <button
                    key={u._id}
                    onClick={() => setSelected(u)}
                    className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-[var(--color-bg-hover)] ${selected?._id === u._id ? 'bg-primary-500/10 ring-1 ring-primary-500' : ''}`}
                  >
                    <Avatar src={u.profilePhoto} name={u.fullName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{u.fullName}</p>
                      <p className="truncate text-xs text-[var(--color-text-muted)]">@{u.username}</p>
                    </div>
                    {selected?._id === u._id && <FiCheck size={16} className="text-primary-500" />}
                  </button>
                ))
              )}
            </div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add a note (optional)"
              rows={2}
              className="w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-primary-500 focus:outline-none"
            />
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => feedMutation.mutate()}
                disabled={feedMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border-primary)] px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
              >
                <FiGlobe size={14} /> My feed
              </button>
              <button
                onClick={() => sendMutation.mutate()}
                disabled={!selected || sendMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
              >
                <FiSend size={14} />
                {selected ? `Send to ${selected.fullName?.split(' ')[0] || 'user'}` : 'Select a person'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
