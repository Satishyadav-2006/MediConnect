import { type InputHTMLAttributes, type ReactNode, forwardRef, useState, useId } from 'react'
import { cn } from '@/utils'
import { FiEye, FiEyeOff } from 'react-icons/fi'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, helperText, type, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const generatedId = useId()
    const inputId = id || generatedId
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" aria-hidden="true">{leftIcon}</div>}
          <input
            ref={ref}
            id={inputId}
            type={isPassword && showPassword ? 'text' : type}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              'w-full rounded-lg border bg-[var(--color-bg-primary)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              error ? 'border-danger-500' : 'border-[var(--color-border-primary)]',
              leftIcon && 'pl-10', (rightIcon || isPassword) && 'pr-10',
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          )}
          {rightIcon && !isPassword && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" aria-hidden="true">{rightIcon}</div>}
        </div>
        {error && <p id={errorId} className="mt-1 text-sm text-danger-500" role="alert">{error}</p>}
        {helperText && !error && <p id={helperId} className="mt-1 text-sm text-[var(--color-text-muted)]">{helperText}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
export default Input
