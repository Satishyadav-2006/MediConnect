import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { cn } from '@/utils'

interface ContextMenuItem {
  label: string
  icon?: ReactNode
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}

interface ContextMenuProps {
  children: ReactNode
  items: ContextMenuItem[]
  align?: 'left' | 'right'
  className?: string
}

export default function ContextMenu({ children, items, align = 'left', className }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [activeIndex, setActiveIndex] = useState(-1)
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const openMenu = useCallback((e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({ x: rect.left, y: rect.bottom })
    }
    setIsOpen(true)
    setActiveIndex(-1)
  }, [])

  const closeMenu = useCallback(() => {
    setIsOpen(false)
    setActiveIndex(-1)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, closeMenu])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          closeMenu()
          break
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex(prev => {
            let next = prev + 1
            while (next < items.length && items[next].disabled) next++
            return next < items.length ? next : prev
          })
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex(prev => {
            let next = prev - 1
            while (next >= 0 && items[next].disabled) next--
            return next >= 0 ? next : prev
          })
          break
        case 'Enter':
          e.preventDefault()
          if (activeIndex >= 0 && !items[activeIndex].disabled) {
            items[activeIndex].onClick()
            closeMenu()
          }
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, activeIndex, items, closeMenu])

  useEffect(() => {
    if (activeIndex >= 0 && menuRef.current) {
      const items_els = menuRef.current.querySelectorAll('[data-menu-item]')
      items_els[activeIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  return (
    <>
      <div ref={triggerRef} onContextMenu={openMenu} className="inline-flex" aria-haspopup="menu">
        <div onClick={openMenu}>{children}</div>
      </div>
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              role="menu"
              className={cn(
                'fixed z-[9999] min-w-[180px] overflow-hidden rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] py-1.5 shadow-xl',
                align === 'right' ? 'origin-top-right' : 'origin-top-left',
                className
              )}
              style={{ top: position.y + 4, left: align === 'left' ? position.x : undefined, right: align === 'right' ? window.innerWidth - position.x : undefined }}
            >
              {items.map((item, i) => (
                <button
                  key={i}
                  data-menu-item
                  role="menuitem"
                  onClick={() => {
                    if (!item.disabled) {
                      item.onClick()
                      closeMenu()
                    }
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  disabled={item.disabled}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors',
                    item.danger
                      ? 'text-danger-500 hover:bg-danger-50'
                      : activeIndex === i
                        ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]'
                        : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]',
                    item.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
