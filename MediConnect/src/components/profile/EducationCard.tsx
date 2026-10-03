import { FiEdit2, FiTrash2, FiCalendar } from 'react-icons/fi'
import { formatFullDate } from '@/utils'
import type { Education } from '@/types'

interface EducationCardProps {
  education: Education
  isOwnProfile?: boolean
  onEdit?: (education: Education) => void
  onDelete?: (id: string) => void
}

export default function EducationCard({ education, isOwnProfile, onEdit, onDelete }: EducationCardProps) {
  const startDate = formatFullDate(education.startDate)
  const endDate = education.isCurrent ? 'Present' : education.endDate ? formatFullDate(education.endDate) : ''

  return (
    <div className="group flex items-start gap-3 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
        <FiCalendar size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">{education.institution}</h4>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {education.degree}{education.field ? ` - ${education.field}` : ''}
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              {startDate}{endDate ? ` - ${endDate}` : ''}
            </p>
            {education.description && (
              <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">{education.description}</p>
            )}
          </div>
          {isOwnProfile && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit?.(education)}
                className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-primary-500"
              >
                <FiEdit2 size={14} />
              </button>
              <button
                onClick={() => onDelete?.(education._id)}
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
