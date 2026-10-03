import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiUserPlus, FiUserCheck, FiCheck } from 'react-icons/fi'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { connectionService } from '@/api/connectionService'
import { useAuth } from '@/contexts/AuthContext'
import { showSuccess, showError } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import { cn } from '@/utils'

interface FollowButtonProps {
  userId: string
  isFollowing: boolean
  variant?: 'primary' | 'outline' | 'ghost'
  size?: 'sm' | 'md'
}

export default function FollowButton({ userId, isFollowing: initialFollowing, variant = 'primary', size = 'sm' }: FollowButtonProps) {
  const queryClient = useQueryClient()
  const { refreshUser } = useAuth()
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [isHovered, setIsHovered] = useState(false)
  const [showSuccessState, setShowSuccessState] = useState(false)

  const followMutation = useMutation({
    mutationFn: () => connectionService.follow(userId),
    onSuccess: () => {
      setIsFollowing(true)
      setShowSuccessState(true)
      setTimeout(() => setShowSuccessState(false), 1200)
      showSuccess('Followed successfully')
      queryClient.invalidateQueries({ queryKey: ['connections'] })
      refreshUser()
    },
    onError: () => showError('Failed to follow user'),
  })

  const unfollowMutation = useMutation({
    mutationFn: () => connectionService.unfollow(userId),
    onSuccess: () => {
      setIsFollowing(false)
      showSuccess('Unfollowed')
      queryClient.invalidateQueries({ queryKey: ['connections'] })
      refreshUser()
    },
    onError: () => showError('Failed to unfollow user'),
  })

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isFollowing) {
      unfollowMutation.mutate()
    } else {
      followMutation.mutate()
    }
  }

  const isLoading = followMutation.isPending || unfollowMutation.isPending

  const getLabel = () => {
    if (showSuccessState) return 'Followed!'
    if (isFollowing && isHovered) return 'Unfollow'
    if (isFollowing) return 'Following'
    return 'Follow'
  }

  const getIcon = () => {
    if (showSuccessState) return <FiCheck size={14} />
    if (isFollowing) return <FiUserCheck size={14} />
    return <FiUserPlus size={14} />
  }

  const getVariant = (): 'primary' | 'outline' | 'ghost' => {
    if (showSuccessState) return 'primary'
    if (isFollowing) return 'outline'
    return variant
  }

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={showSuccessState ? 'success' : 'default'}
          initial={{ opacity: 0.8, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
        >
          <Button
            variant={getVariant()}
            size={size}
            leftIcon={getIcon()}
            onClick={handleClick}
            isLoading={isLoading}
            className={cn(
              isFollowing && !isHovered && !showSuccessState && 'border-primary-500 text-primary-500',
              showSuccessState && 'bg-green-500 border-green-500 text-white'
            )}
          >
            {getLabel()}
          </Button>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
