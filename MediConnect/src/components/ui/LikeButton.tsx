import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiHeart } from 'react-icons/fi'
import { cn } from '@/utils'

interface LikeButtonProps {
  liked?: boolean
  count?: number
  onToggle?: (liked: boolean) => void
  size?: 'sm' | 'md'
}

export default function LikeButton({ liked: initialLiked = false, count = 0, onToggle, size = 'md' }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [showParticles, setShowParticles] = useState(false)

  const handleClick = () => {
    const next = !liked
    setLiked(next)
    if (next) {
      setShowParticles(true)
      setTimeout(() => setShowParticles(false), 600)
    }
    onToggle?.(next)
  }

  const sizeClasses = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <button
      onClick={handleClick}
      aria-pressed={liked}
      aria-label={liked ? 'Unlike' : 'Like'}
      className={cn(
        'relative inline-flex items-center gap-1.5 transition-colors',
        liked ? 'text-red-500' : 'text-[var(--color-text-muted)] hover:text-red-400'
      )}
    >
      <span className="relative">
        <AnimatePresence>
          {showParticles && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-red-400"
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{
                    x: Math.cos((i * 60 * Math.PI) / 180) * 16,
                    y: Math.sin((i * 60 * Math.PI) / 180) * 16,
                    opacity: 0,
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
        <motion.span
          animate={liked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
          className="inline-block"
        >
          <FiHeart size={sizeClasses} className={cn(liked && 'fill-current')} />
        </motion.span>
      </span>
      {count > 0 && <span className="text-sm">{count}</span>}
    </button>
  )
}
