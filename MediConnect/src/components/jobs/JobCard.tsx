import { Link } from 'react-router-dom'
import { FiBookmark, FiMapPin, FiClock } from 'react-icons/fi'
import { cn, formatDate, formatCurrency } from '@/utils'
import type { Job } from '@/types'

interface JobCardProps { job: Job; href?: string; onSave?: (id: string) => void }

export default function JobCard({ job, href, onSave }: JobCardProps) {
  const empType = (job.employmentType || 'internship').replace('_', ' ')
  return (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <Link to={href ?? `/jobs/${job._id}`} className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center shrink-0">
            {job.organization.logo ? <img src={job.organization.logo} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <span className="text-lg font-bold text-primary-500">{job.organization.name[0]}</span>}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-primary-500">{job.title}</h3>
            <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
              <span>{job.organization.name}</span>
              {job.organization.isVerified && <span className="text-primary-500">✓</span>}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
              {job.location && <span className="flex items-center gap-0.5"><FiMapPin size={12} />{job.location}</span>}
              {job.isRemote && <span className="rounded-full bg-accent-50 px-2 py-0.5 text-accent-600 font-medium">Remote</span>}
              <span className="flex items-center gap-0.5"><FiClock size={12} />{formatDate(job.createdAt)}</span>
            </div>
          </div>
        </Link>
        <button onClick={() => onSave?.(job._id)} className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:text-primary-500 hover:bg-[var(--color-bg-hover)]">
          <FiBookmark size={18} fill={job.isSaved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]">{empType}</span>
        {job.salaryMin && job.salaryMax && (
          <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-600">
            {formatCurrency(job.salaryMin)} - {formatCurrency(job.salaryMax)}
          </span>
        )}
        {job.skills.slice(0, 3).map(s => (
          <span key={s} className="rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]">{s}</span>
        ))}
        {job.skills.length > 3 && <span className="rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">+{job.skills.length - 3}</span>}
      </div>
    </div>
  )
}
