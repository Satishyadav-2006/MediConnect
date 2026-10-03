import { Link } from 'react-router-dom'
import { FiHeart, FiMessageCircle, FiShare2, FiBookmark, FiBookOpen } from 'react-icons/fi'
import { cn, formatDate, formatNumber } from '@/utils'
import type { Post } from '@/types'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'

interface ResearchCardProps {
  post: Post
}

export default function ResearchCard({ post }: ResearchCardProps) {
  const research = post.research
  const author = (post.author ?? {}) as { fullName?: string; username?: string; profilePhoto?: string; headline?: string; isVerified?: boolean }

  if (!research) return null

  return (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] overflow-hidden">
      <div className="bg-gradient-to-r from-primary-500/10 to-primary-500/5 px-5 py-3 border-b border-[var(--color-border-primary)]">
        <div className="flex items-center gap-2">
          <FiBookOpen size={16} className="text-primary-500" />
          <Badge variant="primary">Research</Badge>
          {research.journal && (
            <Badge variant="info">{research.journal}</Badge>
          )}
        </div>
      </div>

      <div className="p-5">
        <Link to={`/feed?post=${post._id}`}>
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] hover:text-primary-500 transition-colors leading-snug">
            {research.title}
          </h3>
        </Link>

        <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">
          {research.abstract}
        </p>

        {research.authors.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {research.authors.map((a, i) => (
              <span key={i} className="text-xs text-[var(--color-text-muted)]">
                {a}{i < research.authors.length - 1 ? ',' : ''}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
          {research.publishDate && <span>{formatDate(research.publishDate)}</span>}
          {research.doi && (
            <a
              href={`https://doi.org/${research.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:text-primary-600"
            >
              DOI: {research.doi}
            </a>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border-primary)] pt-3">
          <Link to={`/profile/${author.username}`} className="flex items-center gap-2">
            <Avatar src={author.profilePhoto} name={author.fullName} size="xs" />
            <span className="text-xs font-medium text-[var(--color-text-primary)]">{author.fullName}</span>
            {author.isVerified && <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary-500 text-[7px] text-white">✓</span>}
          </Link>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-danger-500 transition-colors">
              <FiHeart size={14} /> {formatNumber(post.likesCount)}
            </button>
            <button className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-primary-500 transition-colors">
              <FiMessageCircle size={14} /> {formatNumber(post.commentsCount)}
            </button>
            <button className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-accent-500 transition-colors">
              <FiShare2 size={14} />
            </button>
            <button className="text-xs text-[var(--color-text-muted)] hover:text-primary-500 transition-colors">
              <FiBookmark size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
