import { FiEdit2, FiTrash2, FiBriefcase } from 'react-icons/fi'
import { formatFullDate } from '@/utils'
import type { Experience } from '@/types'

interface ExperienceCardProps {
  experience: Experience
  isOwnProfile?: boolean
  onEdit?: (experience: Experience) => void
  onDelete?: (id: string) => void
}

export default function ExperienceCard({ experience, isOwnProfile, onEdit, onDelete }: ExperienceCardProps) {
  const startDate = formatFullDate(experience.startDate)
  const endDate = experience.isCurrent ? 'Present' : experience.endDate ? formatFullDate(experience.endDate) : ''

  return (
    <div className="group flex items-start gap-3 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-bg-tertiary)]">
        <FiBriefcase size={18} className="text-[var(--color-text-muted)]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">{experience.title}</h4>
            <p className="text-sm text-[var(--color-text-secondary)]">{experience.organization}</p>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              {startDate}{endDate ? ` - ${endDate}` : ''}
              {experience.location && ` · ${experience.location}`}
            </p>
            {experience.description && (
              <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">{experience.description}</p>
            )}
          </div>
          {isOwnProfile && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit?.(experience)}
                className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-primary-500"
              >
                <FiEdit2 size={14} />
              </button>
              <button
                onClick={() => onDelete?.(experience._id)}
                className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-danger-500"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
