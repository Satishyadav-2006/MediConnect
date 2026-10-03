import { type TextareaHTMLAttributes, forwardRef, useId } from 'react'
import { cn } from '@/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  maxLength?: number
  showCount?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, maxLength, showCount, value, ...props }, ref) => {
    const errorId = useId()
    const labelId = useId()
    return (
      <div className="w-full">
        {label && <label id={labelId} className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">{label}</label>}
        <textarea
          ref={ref}
          id={labelId}
          maxLength={maxLength}
          value={value}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'w-full rounded-lg border bg-[var(--color-bg-primary)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-colors resize-none',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            error ? 'border-danger-500' : 'border-[var(--color-border-primary)]',
            className
          )}
          {...props}
        />
        <div className="flex justify-between mt-1">
          {error && <p id={errorId} className="text-sm text-danger-500">{error}</p>}
          {showCount && maxLength && <p className="text-sm text-[var(--color-text-muted)] ml-auto">{String(value || '').length}/{maxLength}</p>}
        </div>
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
export default Textarea
