import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface AccessibilityContextType {
  highContrast: boolean
  reducedMotion: boolean
  fontSize: 'sm' | 'md' | 'lg'
  toggleHighContrast: () => void
  toggleReducedMotion: () => void
  setFontSize: (size: 'sm' | 'md' | 'lg') => void
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null)

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [highContrast, setHighContrast] = useState<boolean>(() => localStorage.getItem('medi_high_contrast') === 'true')
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => localStorage.getItem('medi_reduced_motion') === 'true')
  const [fontSize, setFontSizeState] = useState<'sm' | 'md' | 'lg'>(() => {
    const stored = localStorage.getItem('medi_font_size')
    if (stored === 'sm' || stored === 'md' || stored === 'lg') return stored
    return 'md'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast)
    localStorage.setItem('medi_high_contrast', String(highContrast))
  }, [highContrast])

  useEffect(() => {
    document.documentElement.classList.toggle('reduced-motion', reducedMotion)
    localStorage.setItem('medi_reduced_motion', String(reducedMotion))
  }, [reducedMotion])

  useEffect(() => {
    document.documentElement.classList.remove('font-size-sm', 'font-size-md', 'font-size-lg')
    document.documentElement.classList.add('font-size-' + fontSize)
    localStorage.setItem('medi_font_size', fontSize)
  }, [fontSize])

  const toggleHighContrast = () => setHighContrast(p => !p)
  const toggleReducedMotion = () => setReducedMotion(p => !p)
  const setFontSize = (size: 'sm' | 'md' | 'lg') => setFontSizeState(size)

  return (
    <AccessibilityContext.Provider value={{ highContrast, reducedMotion, fontSize, toggleHighContrast, toggleReducedMotion, setFontSize }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) throw new Error('useAccessibility must be used within AccessibilityProvider')
  return context
}
