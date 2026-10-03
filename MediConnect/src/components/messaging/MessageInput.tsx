import { useState, useRef, useCallback } from 'react'
import { FiSend, FiPaperclip, FiSmile } from 'react-icons/fi'

interface MessageInputProps {
  onSend: (content: string) => void
  onTyping?: () => void
  placeholder?: string
  disabled?: boolean
}

export default function MessageInput({ onSend, onTyping, placeholder = 'Type a message...', disabled }: MessageInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text) return
    onSend(text)
    setInput('')
    textareaRef.current?.focus()
  }, [input, onSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    onTyping?.()
  }

  return (
    <div className="flex items-end gap-2 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-4 py-3">
      <button className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]">
        <FiPaperclip size={20} />
      </button>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-primary-500 focus:outline-none disabled:opacity-50"
      />
      <button className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]">
        <FiSmile size={20} />
      </button>
      <button
        onClick={handleSend}
        disabled={!input.trim() || disabled}
        className="rounded-xl bg-primary-500 p-2.5 text-white transition-colors hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FiSend size={18} />
      </button>
    </div>
  )
}
