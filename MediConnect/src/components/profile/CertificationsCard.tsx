import { FiPlus, FiTrash2, FiAward, FiExternalLink } from 'react-icons/fi'
import { formatFullDate } from '@/utils'
import type { Certification } from '@/types'

interface CertificationsCardProps {
  certifications: Certification[]
  isOwnProfile?: boolean
  onAdd?: () => void
  onDelete?: (id: string) => void
}

export default function CertificationsCard({ certifications, isOwnProfile, onAdd, onDelete }: CertificationsCardProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Certifications</h3>
        {isOwnProfile && (
          <button
            onClick={onAdd}
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-primary-500 transition-colors"
          >
            <FiPlus size={16} />
          </button>
        )}
      </div>

      {certifications.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">No certifications added yet.</p>
      ) : (
        <div className="mt-3 divide-y divide-[var(--color-border-primary)]">
          {certifications.map(cert => (
            <div key={cert._id} className="group flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-bg-tertiary)]">
                <FiAward size={18} className="text-primary-500" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">{cert.name}</h4>
                <p className="text-sm text-[var(--color-text-secondary)]">{cert.issuer}</p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                  <span>Issued {formatFullDate(cert.issueDate)}</span>
                  {cert.expiryDate && <span>· Expires {formatFullDate(cert.expiryDate)}</span>}
                </div>
                <div className="mt-1 flex items-center gap-3">
                  {cert.credentialId && (
                    <span className="text-xs text-[var(--color-text-muted)]">ID: {cert.credentialId}</span>
                  )}
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600"
                    >
                      <FiExternalLink size={10} /> View
                    </a>
                  )}
                </div>
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => onDelete?.(cert._id)}
                  className="shrink-0 rounded-lg p-1.5 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 hover:bg-[var(--color-bg-hover)] hover:text-danger-500 transition-all"
                >
                  <FiTrash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
