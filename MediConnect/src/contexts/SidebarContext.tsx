import { createContext, useContext, useState, type ReactNode } from 'react'

interface SidebarContextType {
  isOpen: boolean
  isMobileOpen: boolean
  toggle: () => void
  toggleMobile: () => void
  closeMobile: () => void
}

const SidebarContext = createContext<SidebarContextType | null>(null)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <SidebarContext.Provider value={{
      isOpen,
      isMobileOpen,
      toggle: () => setIsOpen(p => !p),
      toggleMobile: () => setIsMobileOpen(p => !p),
      closeMobile: () => setIsMobileOpen(false),
    }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) throw new Error('useSidebar must be used within SidebarProvider')
  return context
}
