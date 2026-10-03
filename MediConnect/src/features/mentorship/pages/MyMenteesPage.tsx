import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { mentorService } from '@/api/mentorService'
import { extractList } from '@/lib/pagination'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import Skeleton from '@/components/ui/Skeleton'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/utils'

interface Mentee {
  _id: string
  user: {
    _id: string
    fullName: string
    profilePhoto?: string
    specialization?: string
    headline?: string
  }
  startDate: string
  sessionCount: number
  progress: number
}

function useMyMentees() {
  const { data, isLoading } = useQuery({
    queryKey: ['myMentees'],
    queryFn: () => mentorService.getMyMentees(1, 100).then(r => r.data),
  })
  return { data, isLoading }
}

export default function MyMenteesPage() {
  const { data, isLoading } = useMyMentees()

  const mentees = extractList<Mentee>(data)

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">My Mentees</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : mentees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-sm text-[var(--color-text-secondary)]">No mentees yet</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Accept mentorship requests to see your mentees here.</p>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mentees.map(mentee => (
            <motion.div key={mentee._id} variants={staggerItem} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
              <div className="flex items-start gap-4">
                <Avatar
                  name={mentee.user?.fullName}
                  src={mentee.user?.profilePhoto}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{mentee.user?.fullName}</h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">{mentee.user?.specialization || mentee.user?.headline}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-[var(--color-text-muted)]">
                    <span>Started {formatDate(mentee.startDate)}</span>
                    <span>{mentee.sessionCount} sessions</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[var(--color-text-secondary)]">Progress</span>
                      <span className="text-xs font-medium text-[var(--color-text-primary)]">{mentee.progress || 0}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--color-bg-tertiary)]">
                      <div
                        className="h-full rounded-full bg-primary-500 transition-all"
                        style={{ width: `${mentee.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Link to={`/profile/${mentee.user?._id}`}>
                  <Button variant="outline" size="sm">View Profile</Button>
                </Link>
                <Link to="/messages">
                  <Button variant="ghost" size="sm">Message</Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
