import { useState, useRef, useCallback } from 'react'
import { FiUploadCloud, FiX, FiFile, FiImage, FiFilm, FiCheck } from 'react-icons/fi'
import { cn } from '@/utils'

interface UploadedFile {
  file: File
  preview?: string
  progress?: number
  status: 'pending' | 'uploading' | 'done' | 'error'
}

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  maxSize?: number
  maxFiles?: number
  onFiles: (files: File[]) => void
  className?: string
  label?: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileUpload({ accept = '*', multiple = false, maxSize = 10 * 1024 * 1024, maxFiles = 10, onFiles, className, label }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState<UploadedFile[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFiles = useCallback((fileList: FileList) => {
    const files = Array.from(fileList)
    if (!multiple && files.length > 1) {
      setError('Only one file is allowed')
      return
    }
    if (files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`)
      return
    }
    const oversized = files.find(f => f.size > maxSize)
    if (oversized) {
      setError(`File "${oversized.name}" exceeds max size of ${formatSize(maxSize)}`)
      return
    }
    setError(null)
    const newUploaded: UploadedFile[] = files.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      progress: 0,
      status: 'pending' as const,
    }))
    setUploaded(prev => [...prev, ...newUploaded])

    newUploaded.forEach((uf, idx) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 30 + 10
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          setUploaded(prev => prev.map((u, i) => {
            const offset = prev.length - newUploaded.length + idx
            return i === offset ? { ...u, progress: 100, status: 'done' as const } : u
          }))
        } else {
          setUploaded(prev => prev.map((u, i) => {
            const offset = prev.length - newUploaded.length + idx
            return i === offset ? { ...u, progress, status: 'uploading' as const } : u
          }))
        }
      }, 200)
    })

    onFiles(files)
  }, [maxSize, maxFiles, multiple, onFiles])

  const removeFile = (index: number) => {
    setUploaded(prev => {
      const updated = [...prev]
      if (updated[index].preview) URL.revokeObjectURL(updated[index].preview!)
      updated.splice(index, 1)
      return updated
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length) validateFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FiImage size={16} />
    if (type.startsWith('video/')) return <FiFilm size={16} />
    return <FiFile size={16} />
  }

  return (
    <div className={cn('w-full', className)}>
      {label && <p className="mb-2 text-sm font-medium text-[var(--color-text-primary)]">{label}</p>}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click() } }}
        aria-label="File upload area. Click or drag files here to upload."
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors',
          isDragOver ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-[var(--color-border-primary)] hover:border-primary-400 hover:bg-[var(--color-bg-hover)]'
        )}
      >
        <FiUploadCloud size={32} className={cn('mb-2', isDragOver ? 'text-primary-500' : 'text-[var(--color-text-muted)]')} />
        <p className="text-sm font-medium text-[var(--color-text-primary)]">Click to upload or drag and drop</p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Max: {formatSize(maxSize)}{multiple && ` • Up to ${maxFiles} files`}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={e => e.target.files && validateFiles(e.target.files)}
        className="hidden"
        aria-hidden="true"
      />
      {error && <p className="mt-1 text-sm text-danger-500" role="alert">{error}</p>}
      {uploaded.length > 0 && (
        <ul className="mt-3 space-y-2" aria-label="Uploaded files">
          {uploaded.map((uf, i) => (
            <li key={i} className="flex items-center gap-3 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] p-2.5">
              {uf.preview ? (
                <img src={uf.preview} alt={uf.file.name} className="h-10 w-10 rounded object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
                  {getFileIcon(uf.file.type)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{uf.file.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{formatSize(uf.file.size)}</p>
                {(uf.status === 'uploading' || uf.status === 'pending') && (
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-tertiary)]">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all duration-300"
                      style={{ width: `${uf.progress || 0}%` }}
                    />
                  </div>
                )}
              </div>
              {uf.status === 'done' ? (
                <FiCheck size={16} className="text-accent-500 shrink-0" aria-label="Upload complete" />
              ) : (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeFile(i) }}
                  className="shrink-0 rounded p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-danger-500 transition-colors"
                  aria-label={`Remove ${uf.file.name}`}
                >
                  <FiX size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
