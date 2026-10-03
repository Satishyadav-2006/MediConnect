import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiEdit2, FiImage, FiVideo, FiFileText, FiCalendar, FiBriefcase, FiBookOpen } from 'react-icons/fi'
import { cn } from '@/utils'
import { ROLES } from '@/constants'
import { useAuth } from '@/contexts/AuthContext'

interface CreateMenuDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: string) => void
}

const menuItems = [
  { type: 'post', label: 'Create Post', description: 'Share updates with your network', icon: <FiEdit2 size={20} />, color: 'text-primary-500 bg-primary-50 dark:bg-primary-900/20' },
  { type: 'image_post', label: 'Share Photo', description: 'Post images and photos', icon: <FiImage size={20} />, color: 'text-accent-500 bg-accent-50 dark:bg-accent-900/20' },
  { type: 'video_post', label: 'Share Video', description: 'Post video content', icon: <FiVideo size={20} />, color: 'text-danger-500 bg-danger-50 dark:bg-danger-900/20' },
  { type: 'article', label: 'Write Article', description: 'Publish a long-form article', icon: <FiFileText size={20} />, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
  { type: 'event', label: 'Create Event', description: 'Host a new event', icon: <FiCalendar size={20} />, color: 'text-warning-500 bg-warning-50 dark:bg-warning-900/20' },
  { type: 'job', label: 'Post a Job', description: 'Hire top healthcare talent', icon: <FiBriefcase size={20} />, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  { type: 'research', label: 'Share Research', description: 'Publish research findings', icon: <FiBookOpen size={20} />, color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20' },
]

export default function CreateMenuDrawer({ isOpen, onClose, onSelect }: CreateMenuDrawerProps) {
  const { user } = useAuth()
  const isRecruiting = user && ROLES.RECRUITING.includes(user.role as typeof ROLES.RECRUITING[number])
  const visibleItems = menuItems.filter(item => item.type !== 'job' || isRecruiting)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4 shadow-xl sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:right-auto sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Create</h2>
              <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]">
                <FiX size={20} />
              </button>
            </div>
            <div className="space-y-2">
              {visibleItems.map(item => (
                <button
                  key={item.type}
                  onClick={() => { onSelect(item.type); onClose() }}
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-[var(--color-bg-hover)]"
                >
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', item.color)}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{item.label}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
