import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronDown } from 'react-icons/fi'
import { cn } from '@/utils'

interface AccordionContextType {
  openItems: Set<string>
  toggle: (id: string) => void
}

const AccordionContext = createContext<AccordionContextType>({ openItems: new Set(), toggle: () => {} })

interface AccordionItemContextType {
  id: string
  isOpen: boolean
  onToggle: () => void
}

const AccordionItemContext = createContext<AccordionItemContextType>({ id: '', isOpen: false, onToggle: () => {} })

export function Accordion({ children, className, defaultOpen }: { children: ReactNode; className?: string; defaultOpen?: string[] }) {
  const [openItems, setOpenItems] = useState<Set<string>>(() => new Set(defaultOpen || []))

  const toggle = useCallback((id: string) => {
    setOpenItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return (
    <AccordionContext.Provider value={{ openItems, toggle }}>
      <div className={cn('divide-y divide-[var(--color-border-primary)] rounded-lg border border-[var(--color-border-primary)]', className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
}

export function AccordionItem({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  const { openItems, toggle } = useContext(AccordionContext)
  const isOpen = openItems.has(id)
  const onToggle = () => toggle(id)

  return (
    <AccordionItemContext.Provider value={{ id, isOpen, onToggle }}>
      <div className={className}>{children}</div>
    </AccordionItemContext.Provider>
  )
}

export function AccordionTrigger({ children, icon, className }: { children: ReactNode; icon?: ReactNode; className?: string }) {
  const { id, isOpen, onToggle } = useContext(AccordionItemContext)

  return (
    <button
      onClick={onToggle}
      id={`accordion-trigger-${id}`}
      aria-expanded={isOpen}
      aria-controls={`accordion-panel-${id}`}
      role="heading"
      aria-level={3}
      className={cn(
        'flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors',
        className
      )}
    >
      <span className="flex items-center gap-2">
        {icon && <span className="text-[var(--color-text-muted)]">{icon}</span>}
        {children}
      </span>
      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
        <FiChevronDown size={16} className="text-[var(--color-text-muted)]" />
      </motion.div>
    </button>
  )
}

export function AccordionContent({ children, className }: { children: ReactNode; className?: string }) {
  const { id, isOpen } = useContext(AccordionItemContext)

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
          id={`accordion-panel-${id}`}
          role="region"
          aria-labelledby={`accordion-trigger-${id}`}
        >
          <div className={cn('px-4 pb-3 text-sm text-[var(--color-text-secondary)]', className)}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
