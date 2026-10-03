import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiEdit3, FiBriefcase, FiSearch, FiCalendar, FiAward, FiMessageSquare } from 'react-icons/fi'
import { cn } from '@/utils'

const actions = [
  { label: 'Create Post', icon: FiEdit3, to: '/feed', color: 'bg-blue-100 text-blue-600' },
  { label: 'Find Jobs', icon: FiBriefcase, to: '/jobs', color: 'bg-orange-100 text-orange-600' },
  { label: 'Search Professionals', icon: FiSearch, to: '/search', color: 'bg-purple-100 text-purple-600' },
  { label: 'Join Events', icon: FiCalendar, to: '/events', color: 'bg-cyan-100 text-cyan-600' },
  { label: 'Request Mentor', icon: FiAward, to: '/mentorship', color: 'bg-teal-100 text-teal-600' },
  { label: 'View Messages', icon: FiMessageSquare, to: '/messages', color: 'bg-indigo-100 text-indigo-600' },
]

export default function QuickActions() {
  return (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
      <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map(action => (
          <Link key={action.label} to={action.to}>
            <motion.div
              whileHover={{ y: -2, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-2 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', action.color)}>
                <action.icon size={20} />
              </div>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">{action.label}</span>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  )
}
