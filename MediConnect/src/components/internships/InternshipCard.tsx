import { Link } from 'react-router-dom'
import { FiMapPin, FiBookmark } from 'react-icons/fi'
import { formatCurrency } from '@/utils'
import type { Internship } from '@/types'

interface InternshipCardProps {
  internship: Internship
  href?: string
  onSave?: (id: string, isSaved: boolean) => void
}

export default function InternshipCard({ internship, href, onSave }: InternshipCardProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <Link to={href ?? `/internships/${internship._id}`} className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center shrink-0">
            {internship.organization?.logo ? <img src={internship.organization.logo} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <span className="text-lg font-bold text-primary-500">{internship.organization?.name?.[0]}</span>}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-primary-500">{internship.title}</h3>
            <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
              <span>{internship.organization?.name}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
              {internship.location && <span className="flex items-center gap-0.5"><FiMapPin size={12} />{internship.location}</span>}
              {internship.isRemote && <span className="rounded-full bg-accent-50 px-2 py-0.5 text-accent-600 font-medium">Remote</span>}
              <span>{internship.duration}</span>
            </div>
          </div>
        </Link>
        <button onClick={() => onSave?.(internship._id, internship.isSaved)} className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:text-primary-500 hover:bg-[var(--color-bg-hover)]">
          <FiBookmark size={18} fill={internship.isSaved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-secondary)] capitalize">{internship.type}</span>
        {internship.stipend && <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-600">{formatCurrency(internship.stipend)}/mo</span>}
        {internship.skills.slice(0, 3).map(s => (
          <span key={s} className="rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]">{s}</span>
        ))}
      </div>
    </div>
  )
}
