import { motion } from 'framer-motion'
import { cn } from '@/utils'

interface ReactionBarProps {
  activeReaction?: string | null
  onReact?: (type: string) => void
}

const reactions: { type: string; emoji: string; label: string }[] = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'celebrate', emoji: '🎉', label: 'Celebrate' },
  { type: 'support', emoji: '💪', label: 'Support' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'insightful', emoji: '💡', label: 'Insightful' },
]

export default function ReactionBar({ activeReaction, onReact }: ReactionBarProps) {
  return (
    <div className="flex items-center gap-0.5">
      {reactions.map(r => (
        <motion.button
          key={r.type}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onReact?.(r.type)}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors',
            activeReaction === r.type
              ? 'bg-primary-100 dark:bg-primary-900/30'
              : 'hover:bg-[var(--color-bg-hover)]'
          )}
          title={r.label}
        >
          {r.emoji}
        </motion.button>
      ))}
    </div>
  )
}
