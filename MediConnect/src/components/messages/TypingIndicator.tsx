import { motion } from 'framer-motion'

interface TypingIndicatorProps {
  userName: string
}

export default function TypingIndicator({ userName }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex items-center gap-0.5 rounded-2xl bg-[var(--color-bg-tertiary)] px-3.5 py-2 rounded-bl-md">
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-text-muted)]"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <span className="text-xs text-[var(--color-text-muted)]">{userName} is typing...</span>
    </div>
  )
}
