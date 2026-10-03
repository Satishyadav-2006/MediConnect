import { FiMapPin, FiBriefcase, FiGlobe, FiEdit2 } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import type { User } from '@/types'
import Chip from '@/components/ui/Chip'

interface AboutCardProps {
  user: User
  isOwnProfile?: boolean
}

export default function AboutCard({ user, isOwnProfile }: AboutCardProps) {
  const hasContent = user.bio || user.location || user.specialization || user.yearsOfExperience || user.languages.length > 0

  return (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">About</h3>
        {isOwnProfile && (
          <Link to="/profile/edit" className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-primary-500 transition-colors">
            <FiEdit2 size={16} />
          </Link>
        )}
      </div>

      {!hasContent ? (
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">No information added yet.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {user.bio && (
            <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed">{user.bio}</p>
          )}
          {user.location && (
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <FiMapPin size={14} className="shrink-0 text-[var(--color-text-muted)]" />
              <span>{user.location}</span>
            </div>
          )}
          {user.specialization && (
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <FiBriefcase size={14} className="shrink-0 text-[var(--color-text-muted)]" />
              <span>{user.specialization}</span>
            </div>
          )}
          {user.yearsOfExperience !== undefined && user.yearsOfExperience !== null && (
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <FiBriefcase size={14} className="shrink-0 text-[var(--color-text-muted)]" />
              <span>{user.yearsOfExperience} years of experience</span>
            </div>
          )}
          {user.languages.length > 0 && (
            <div className="flex items-start gap-2">
              <FiGlobe size={14} className="mt-0.5 shrink-0 text-[var(--color-text-muted)]" />
              <div className="flex flex-wrap gap-1.5">
                {user.languages.map(lang => (
                  <Chip key={lang}>{lang}</Chip>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
