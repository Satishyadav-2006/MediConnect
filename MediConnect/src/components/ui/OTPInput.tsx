import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle, useId } from 'react'
import { cn } from '@/utils'

interface OTPInputProps {
  length?: number
  onComplete?: (value: string) => void
  value?: string
  onChange?: (value: string) => void
  error?: string
}

export interface OTPInputRef {
  focus: () => void
  clear: () => void
}

const OTPInput = forwardRef<OTPInputRef, OTPInputProps>(
  ({ length = 6, onComplete, value = '', onChange, error }, ref) => {
    const [digits, setDigits] = useState<string[]>(() => {
      const arr = Array(length).fill('')
      if (value) value.split('').forEach((ch, i) => { if (i < length) arr[i] = ch })
      return arr
    })
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const errorId = useId()

    useEffect(() => {
      const arr = Array(length).fill('')
      if (value) value.split('').forEach((ch, i) => { if (i < length) arr[i] = ch })
      setDigits(arr)
    }, [value, length])

    const updateDigits = useCallback((newDigits: string[]) => {
      setDigits(newDigits)
      const joined = newDigits.join('')
      onChange?.(joined)
      if (newDigits.every(d => d !== '') && onComplete) onComplete(joined)
    }, [onChange, onComplete])

    useImperativeHandle(ref, () => ({
      focus: () => inputRefs.current[0]?.focus(),
      clear: () => {
        const arr = Array(length).fill('')
        setDigits(arr)
        onChange?.('')
        inputRefs.current[0]?.focus()
      },
    }))

    const handleChange = (index: number, val: string) => {
      const digit = val.replace(/\D/g, '').slice(-1)
      const newDigits = [...digits]
      newDigits[index] = digit
      updateDigits(newDigits)
      if (digit && index < length - 1) inputRefs.current[index + 1]?.focus()
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        const newDigits = [...digits]
        newDigits[index - 1] = ''
        updateDigits(newDigits)
        inputRefs.current[index - 1]?.focus()
      }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault()
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
      const newDigits = [...digits]
      pasted.split('').forEach((ch, i) => { newDigits[i] = ch })
      updateDigits(newDigits)
      const nextEmpty = newDigits.findIndex(d => d === '')
      const focusIndex = nextEmpty === -1 ? length - 1 : nextEmpty
      inputRefs.current[focusIndex]?.focus()
    }

    return (
      <div className="flex flex-col items-center gap-2" role="group" aria-label="One-time password" aria-describedby={error ? errorId : undefined}>
        <div className="flex gap-2">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className={cn(
                'h-12 w-12 rounded-lg border bg-[var(--color-bg-primary)] text-center text-lg font-semibold text-[var(--color-text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500',
                error ? 'border-danger-500' : 'border-[var(--color-border-primary)]'
              )}
            />
          ))}
        </div>
        {error && <p id={errorId} className="text-sm text-danger-500">{error}</p>}
      </div>
    )
  }
)

OTPInput.displayName = 'OTPInput'
export default OTPInput
