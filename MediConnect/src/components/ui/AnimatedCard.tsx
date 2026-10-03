import { motion } from 'framer-motion'
import { cn } from '@/utils'

interface AnimatedCardProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export default function AnimatedCard({ children, onClick, className }: AnimatedCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, boxShadow: '0 8px 25px -5px rgba(0,0,0,0.1)' }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      onClick={onClick}
      role="article"
      className={cn(
        'rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </motion.div>
  )
}
