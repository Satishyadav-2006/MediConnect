import { cn } from '@/utils'
import { FiDownload, FiExternalLink, FiFileText } from 'react-icons/fi'

interface PDFViewerProps {
  url: string
  filename?: string
  className?: string
}

export default function PDFViewer({ url, filename, className }: PDFViewerProps) {
  const displayName = filename || url.split('/').pop() || 'Document.pdf'

  return (
    <div className={cn('rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] overflow-hidden', className)} role="region" aria-label={`PDF viewer: ${displayName}`}>
      <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <FiFileText size={18} className="text-danger-500 shrink-0" />
          <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">{displayName}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={url}
            download={displayName}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <FiDownload size={14} />
            Download
          </a>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors"
          >
            <FiExternalLink size={14} />
            Open
          </a>
        </div>
      </div>

      <div className="w-full" style={{ minHeight: '600px' }}>
        {url ? (
          <iframe
            src={url}
            title={displayName}
            className="w-full border-0"
            style={{ height: '700px', minHeight: '600px' }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FiFileText size={48} className="text-[var(--color-text-muted)] mb-3" />
            <p className="text-sm text-[var(--color-text-muted)]">Unable to load PDF</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 text-sm text-primary-500 hover:text-primary-600 font-medium"
            >
              Try opening in a new tab
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
