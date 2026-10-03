import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiMessageCircle, FiShare2, FiBookmark, FiMoreHorizontal, FiGlobe, FiUsers, FiLock, FiFile, FiVideo } from 'react-icons/fi'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cn, formatDate, formatNumber } from '@/utils'
import type { Post } from '@/types'
import { postService } from '@/api/postService'
import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import ShareDialog from '@/components/modals/ShareDialog'
import ReactionBar from '@/components/feed/ReactionBar'
import { showError } from '@/components/ui/Toast'

interface PostCardProps {
  post: Post
  onDelete?: (id: string) => void
  onImageClick?: (images: string[], index: number) => void
  onToggleComments?: () => void
}

export default function PostCard({ post, onDelete, onImageClick, onToggleComments }: PostCardProps) {
  const queryClient = useQueryClient()
  const [showFullContent, setShowFullContent] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const author = (post.author ?? {}) as { fullName?: string; username?: string; profilePhoto?: string; headline?: string; isVerified?: boolean }

  type RawMedia = string | { cloudinary_url?: string; media_type?: string; url?: string; type?: string; file_name?: string; name?: string }
  const rawMedia = (post as { media?: RawMedia[] }).media
  const mediaList: RawMedia[] = Array.isArray(rawMedia) ? rawMedia : []
  const toMediaUrl = (m: RawMedia): string => typeof m === 'string' ? m : (m.cloudinary_url || m.url || '')
  const images = mediaList.length > 0
    ? mediaList.map(toMediaUrl).filter(Boolean)
    : (post.images ?? [])
  const videoUrl = mediaList.find(m => typeof m !== 'string' && (m.media_type === 'video' || m.type === 'video'))
    ? toMediaUrl(mediaList.find(m => typeof m !== 'string' && (m.media_type === 'video' || m.type === 'video'))!)
    : (post.video ?? '')
  const docItem = (() => {
    const d = mediaList.find(m => typeof m !== 'string' && (m.media_type === 'document' || m.type === 'document'))
    if (d && typeof d !== 'string') {
      return { url: toMediaUrl(d), name: d.file_name || d.name || 'Attachment' }
    }
    return post.document ?? undefined
  })()
  const createdAt = (post as { created_at?: string }).created_at ?? post.createdAt

  const likeMutation = useMutation({
    mutationFn: () => post.isLiked ? postService.unlikePost(post._id) : postService.likePost(post._id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
    onError: () => showError('Failed to update reaction'),
  })

  const reactMutation = useMutation({
    mutationFn: (reactionType: string) => postService.reactToPost(post._id, reactionType),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
    onError: () => showError('Failed to update reaction'),
  })

  const saveMutation = useMutation({
    mutationFn: () => post.isSaved ? postService.unsavePost(post._id) : postService.savePost(post._id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['feed'] }); queryClient.invalidateQueries({ queryKey: ['savedPosts'] }) },
    onError: () => showError('Failed to save post'),
  })

  const visIcon = post.visibility === 'connections' ? <FiUsers size={12} /> : post.visibility === 'private' ? <FiLock size={12} /> : <FiGlobe size={12} />

  const content = post.content.length > 300 && !showFullContent
    ? post.content.slice(0, 300) + '...'
    : post.content

  return (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <Link to={`/profile/${author.username}`} className="flex items-center gap-3">
            <Avatar src={author.profilePhoto} name={author.fullName} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">{author.fullName}</span>
                {author.isVerified && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[8px] text-white">✓</span>}
              </div>
              <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                {author.headline && <span>{author.headline}</span>}
                <span>·</span>
                <span>{formatDate(createdAt)}</span>
                <span>·</span>
                {visIcon}
              </div>
            </div>
          </Link>
          <Dropdown
            trigger={<button className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"><FiMoreHorizontal size={18} /></button>}
            items={[
              { label: 'Copy link', onClick: () => navigator.clipboard.writeText(`${window.location.origin}/feed?post=${post._id}`) },
              ...(onDelete ? [{ label: 'Delete', onClick: () => onDelete(post._id), danger: true }] : []),
            ]}
          />
        </div>

        <div className="mt-3">
          <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap">{content}</p>
          {post.content.length > 300 && (
            <button onClick={() => setShowFullContent(p => !p)} className="mt-1 text-sm font-medium text-primary-500 hover:text-primary-600">
              {showFullContent ? 'Show less' : 'See more'}
            </button>
          )}
        </div>

        {images.length > 0 && (
          <div className={cn('mt-3 grid gap-1 rounded-lg overflow-hidden', images.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
            {images.slice(0, 4).map((img, i) => (
              <div key={i} className="relative aspect-square">
                <img
                  src={img}
                  alt=""
                  className="h-full w-full object-cover cursor-pointer"
                  onClick={() => onImageClick?.(images, i)}
                />
                {i === 3 && images.length > 4 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white font-semibold">
                    +{images.length - 4}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {videoUrl && (
          <div className="mt-3 overflow-hidden rounded-lg">
            <video src={videoUrl} controls className="w-full max-h-96" />
          </div>
        )}

        {docItem && (
          <a
            href={docItem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-3 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] p-3 hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <div className="rounded-lg bg-primary-100 p-2">
              {videoUrl ? <FiVideo size={20} className="text-primary-600" /> : <FiFile size={20} className="text-primary-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{docItem.name || 'Attachment'}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Open document</p>
            </div>
          </a>
        )}

        {post.poll && (
          <div className="mt-3 rounded-lg border border-[var(--color-border-primary)] p-3">
            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-2">{post.poll.question}</p>
            {post.poll.options.map(opt => (
              <div key={opt._id} className="mb-1.5">
                <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mb-0.5">
                  <span>{opt.text}</span>
                  <span>{opt.percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--color-bg-tertiary)]">
                  <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${opt.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {(post.likesCount > 0 || post.commentsCount > 0) && (
          <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>{post.likesCount > 0 && `${formatNumber(post.likesCount)} likes`}</span>
            <span>{post.commentsCount > 0 && `${post.commentsCount} comments`}</span>
          </div>
        )}
      </div>

      <div className="flex items-center border-t border-[var(--color-border-primary)]">
        <div className="flex-1 flex justify-center py-1.5">
          <ReactionBar
            activeReaction={post.isLiked ? 'like' : null}
            onReact={(type) => {
              if (type === 'like') {
                likeMutation.mutate()
              } else {
                reactMutation.mutate(type)
              }
            }}
          />
        </div>
        <button onClick={onToggleComments} className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors">
          <FiMessageCircle size={16} /> Comment
        </button>
        <button
          onClick={() => setShowShare(true)}
          className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
        >
          <FiShare2 size={16} /> Share
        </button>
        <button
          onClick={() => saveMutation.mutate()}
          className={cn('flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors',
            post.isSaved ? 'text-primary-500' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
          )}
        >
          <FiBookmark size={16} fill={post.isSaved ? 'currentColor' : 'none'} /> Save
        </button>
      </div>
      <ShareDialog
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        url={`${window.location.origin}/feed?post=${post._id}`}
        title={post.content}
        postId={post._id}
      />
    </div>
  )
}
