import { useEffect, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX } from 'react-icons/fi'
import { cn } from '@/utils'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  side?: 'left' | 'right' | 'bottom'
  size?: 'sm' | 'md' | 'lg' | 'full'
}

const sizeClasses = {
  sm: 'w-80',
  md: 'w-96',
  lg: 'w-[32rem]',
  full: 'w-full',
}

const sideVariants = {
  left: { hidden: { x: '-100%' }, visible: { x: 0 } },
  right: { hidden: { x: '100%' }, visible: { x: 0 } },
  bottom: { hidden: { y: '100%' }, visible: { y: 0 } },
}

export default function Drawer({ isOpen, onClose, title, children, side = 'right', size = 'md' }: DrawerProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, handleEscape])

  const isHorizontal = side === 'left' || side === 'right'

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={sideVariants[side]}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'absolute flex flex-col bg-[var(--color-bg-primary)] shadow-xl',
              isHorizontal && `${sizeClasses[size]} top-0 bottom-0`,
              side === 'left' && 'left-0',
              side === 'right' && 'right-0',
              !isHorizontal && `left-0 right-0 max-h-[80vh] bottom-0 rounded-t-xl`,
              !isHorizontal && size === 'full' && 'max-h-[90vh]'
            )}
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Drawer'}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] px-6 py-4">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
                >
                  <FiX size={20} />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
