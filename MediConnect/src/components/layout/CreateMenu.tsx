import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPlus, FiFileText, FiBriefcase, FiCalendar } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/utils'
import { ROUTES } from '@/constants/routes'
import { ROLES } from '@/constants'

interface CreateOption {
  label: string
  icon: React.ReactNode
  onClick: () => void
  roles?: readonly string[]
}

export default function CreateMenu() {
  const { user, isVerified } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const isRecruiting = user && ROLES.RECRUITING.includes(user.role as typeof ROLES.RECRUITING[number])

  const options: CreateOption[] = [
    ...(isVerified
      ? [
          {
            label: 'Create Post',
            icon: <FiFileText size={16} />,
            onClick: () => { navigate(ROUTES.FEED); setIsOpen(false) },
          },
          {
            label: 'Create Event',
            icon: <FiCalendar size={16} />,
            onClick: () => { navigate(ROUTES.EVENT_CREATE); setIsOpen(false) },
          },
        ]
      : []),
    ...(isRecruiting
      ? [
          {
            label: 'Create Job',
            icon: <FiBriefcase size={16} />,
            onClick: () => { navigate(ROUTES.JOB_CREATE); setIsOpen(false) },
          },
          {
            label: 'Create Internship',
            icon: <FiBriefcase size={16} />,
            onClick: () => { navigate('/internships/create'); setIsOpen(false) },
          },
        ]
      : []),
  ]

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(p => !p)}
        className="flex items-center gap-1 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
      >
        <FiPlus size={16} />
        <span className="hidden sm:inline">Create</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] py-1.5 shadow-xl z-50"
          >
            {options.map(option => (
              <button
                key={option.label}
                onClick={option.onClick}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-primary)]',
                  'hover:bg-[var(--color-bg-hover)] transition-colors'
                )}
              >
                <span className="text-[var(--color-text-secondary)]">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
