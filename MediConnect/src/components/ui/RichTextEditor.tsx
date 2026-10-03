import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/utils'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: number
}

const toolbarButtons = [
  { label: 'Bold', prefix: '**', suffix: '**', icon: 'B', ariaLabel: 'Bold text' },
  { label: 'Italic', prefix: '_', suffix: '_', icon: 'I', ariaLabel: 'Italic text' },
  { label: 'Strikethrough', prefix: '~~', suffix: '~~', icon: 'S', ariaLabel: 'Strikethrough text' },
  { label: 'Heading', prefix: '## ', suffix: '', icon: 'H', ariaLabel: 'Insert heading' },
  { label: 'Quote', prefix: '> ', suffix: '', icon: '"', ariaLabel: 'Insert blockquote' },
  { label: 'Code', prefix: '`', suffix: '`', icon: '<>', ariaLabel: 'Insert inline code' },
  { label: 'List', prefix: '- ', suffix: '', icon: '•', ariaLabel: 'Insert unordered list' },
  { label: 'Link', prefix: '[', suffix: '](url)', icon: '🔗', ariaLabel: 'Insert link' },
]

function SimpleMarkdownPreview({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none p-3 text-sm text-[var(--color-text-primary)]">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mt-3 mb-1">{line.slice(3)}</h2>
        if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-3 mb-1">{line.slice(2)}</h1>
        if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-primary-400 pl-3 text-[var(--color-text-secondary)] italic my-1">{line.slice(2)}</blockquote>
        if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>
        if (line.match(/^\d+\.\s/)) return <li key={i} className="ml-4 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>
        if (line.trim() === '') return <br key={i} />
        const formatted = line
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/_(.*?)_/g, '<em>$1</em>')
          .replace(/~~(.*?)~~/g, '<del>$1</del>')
          .replace(/`([^`]+)`/g, '<code class="bg-[var(--color-bg-tertiary)] px-1 py-0.5 rounded text-xs">$1</code>')
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary-500 underline">$1</a>')
        return <p key={i} className="my-1" dangerouslySetInnerHTML={{ __html: formatted }} />
      })}
    </div>
  )
}

export default function RichTextEditor({ value, onChange, placeholder = 'Write something...', className, minHeight = 150 }: RichTextEditorProps) {
  const [showPreview, setShowPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertMarkdown = useCallback((prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.substring(start, end)
    const newText = value.substring(0, start) + prefix + selected + suffix + value.substring(end)
    onChange(newText)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
    }, 0)
  }, [value, onChange])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') { e.preventDefault(); insertMarkdown('**', '**') }
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') { e.preventDefault(); insertMarkdown('_', '_') }
    }
    textarea.addEventListener('keydown', handler)
    return () => textarea.removeEventListener('keydown', handler)
  }, [insertMarkdown])

  return (
    <div className={cn('rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]', className)}>
      <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] px-3 py-2">
        <div className="flex items-center gap-0.5">
          {toolbarButtons.map(btn => (
            <button
              key={btn.label}
              type="button"
              onClick={() => insertMarkdown(btn.prefix, btn.suffix)}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded text-sm font-bold transition-colors',
                'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
              )}
              title={btn.label}
              aria-label={btn.ariaLabel}
            >
              {btn.icon}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(p => !p)}
          className={cn(
            'rounded px-2 py-1 text-xs font-medium transition-colors',
            showPreview ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
          )}
          aria-label={showPreview ? 'Show editor' : 'Show preview'}
          aria-pressed={showPreview}
        >
          {showPreview ? 'Edit' : 'Preview'}
        </button>
      </div>
      {showPreview ? (
        <SimpleMarkdownPreview content={value} />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ minHeight }}
          className="w-full resize-none bg-transparent p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
          aria-label="Rich text editor"
        />
      )}
    </div>
  )
}
