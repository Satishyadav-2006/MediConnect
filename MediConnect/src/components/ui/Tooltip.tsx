import { useState, useRef, useId } from 'react'
import { cn } from '@/utils'

interface TooltipProps {
  children: React.ReactNode
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export default function Tooltip({ children, content, position = 'top', className }: TooltipProps) {
  const [show, setShow] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tooltipId = useId()

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div className="relative inline-flex" onMouseEnter={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); setShow(true) }} onMouseLeave={() => { timeoutRef.current = setTimeout(() => setShow(false), 200) }}>
      <div aria-describedby={show ? tooltipId : undefined}>{children}</div>
      {show && (
        <div id={tooltipId} role="tooltip" className={cn('absolute z-50 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg', positions[position], className)}>
          {content}
        </div>
      )}
    </div>
  )
}
