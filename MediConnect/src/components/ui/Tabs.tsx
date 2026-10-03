import { useState, createContext, useContext, type ReactNode } from 'react'
import { cn } from '@/utils'
import { motion } from 'framer-motion'

interface TabsContextType { activeTab: string; setActiveTab: (tab: string) => void }
const TabsContext = createContext<TabsContextType>({ activeTab: '', setActiveTab: () => {} })

export function Tabs({ defaultValue, children, className, onValueChange }: { defaultValue: string; children: ReactNode; className?: string; onValueChange?: (value: string) => void }) {
  const [activeTab, setActiveTab] = useState(defaultValue)
  const handleSetActiveTab = (tab: string) => { setActiveTab(tab); onValueChange?.(tab) }
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleSetActiveTab }}>
      <div className={cn(className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex gap-1 border-b border-[var(--color-border-primary)]', className)} role="tablist">{children}</div>
}

export function TabTrigger({ value, children, className, onClick }: { value: string; children: ReactNode; className?: string; onClick?: () => void }) {
  const { activeTab, setActiveTab } = useContext(TabsContext)
  const isActive = activeTab === value
  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      id={`tab-${value}`}
      onClick={() => { setActiveTab(value); onClick?.() }}
      className={cn(
        'relative px-4 py-2.5 text-sm font-medium transition-colors',
        isActive ? 'text-primary-500' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
        className
      )}
    >
      {children}
      {isActive && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />}
    </button>
  )
}

export function TabContent({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const { activeTab } = useContext(TabsContext)
  if (activeTab !== value) return null
  return (
    <motion.div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('py-4', className)}
      tabIndex={0}
    >
      {children}
    </motion.div>
  )
}
