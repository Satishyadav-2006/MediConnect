import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import en from './en'
import ar from './ar'

type Locale = 'en' | 'ar'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslationKeys = Record<string, any>

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: TranslationKeys
  isRTL: boolean
}

const I18nContext = createContext<I18nContextType | null>(null)

const translations: Record<Locale, TranslationKeys> = { en, ar }

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => (localStorage.getItem('medi_locale') as Locale) || 'en')

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('medi_locale', l)
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = l
  }, [])

  const value: I18nContextType = {
    locale,
    setLocale,
    t: translations[locale],
    isRTL: locale === 'ar',
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used within I18nProvider')
  return context
}
