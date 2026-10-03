import { useState } from 'react'
import { useI18n } from '@/config/i18n'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiStar, FiClock, FiMessageSquare } from 'react-icons/fi'
import { useMentor, useRequestMentorship } from '@/features/mentorship/hooks/useMentors'
import { pageTransition } from '@/animations'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Textarea from '@/components/ui/Textarea'
import Modal from '@/components/ui/Modal'
import Skeleton from '@/components/ui/Skeleton'
import { cn } from '@/utils'
import type { Mentor, AvailabilitySlot } from '@/types'

type SlotMap = Record<string, AvailabilitySlot[]>

function groupByDay(slots: AvailabilitySlot[]): SlotMap {
  const acc: SlotMap = {}
  for (const slot of slots) {
    if (!acc[slot.day]) acc[slot.day] = []
    acc[slot.day].push(slot)
  }
  return acc
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function MentorDetailPage() {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, isError } = useMentor(id || '')
  const requestMentorship = useRequestMentorship()
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [message, setMessage] = useState('')

  const mentor = (data?.data?.mentor || data?.data || data) as Mentor | undefined

  if (isLoading) {
    return (
      <motion.div {...pageTransition} className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </motion.div>
    )
  }

  if (isError || !mentor) {
    return (
      <motion.div {...pageTransition} className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Mentor not found</h2>
        <Button onClick={() => navigate(-1)} className="mt-4" variant="outline">Go Back</Button>
      </motion.div>
    )
  }

  const handleRequest = () => {
    if (!message.trim()) return
    requestMentorship.mutate(
      { mentorId: mentor._id, message: message.trim() },
      {
        onSuccess: () => { setShowRequestModal(false); setMessage('') },
      }
    )
  }

  const groupedAvailability = mentor.availability?.length ? groupByDay(mentor.availability) : {}
  const sortedDays = Object.keys(groupedAvailability).sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
  const menteeCapacity = mentor.maxMentees - mentor.menteesCount

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-4xl space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
        <FiArrowLeft size={16} /> Back to mentors
      </button>

      <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
        <div className="flex items-start gap-4">
          <Avatar src={mentor.user.profilePhoto} name={mentor.user.fullName} size="xl" />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{mentor.user.fullName}</h1>
                <p className="text-sm text-[var(--color-text-secondary)]">{mentor.user.specialization || mentor.user.headline}</p>
              </div>
              {mentor.isAvailable ? <Badge variant="success" dot>Available</Badge> : <Badge variant="default">Not Available</Badge>}
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
              <span className="flex items-center gap-1 text-warning-500"><FiStar size={14} fill="currentColor" />{mentor.rating.toFixed(1)} ({mentor.reviewsCount} reviews)</span>
              <span>{mentor.yearsOfExperience} years experience</span>
              <span>{mentor.menteesCount} mentees</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {mentor.specializations.map(s => <Badge key={s} variant="primary" size="sm">{s}</Badge>)}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">{t.mentorship.about}</h3>
          <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{mentor.bio}</p>
        </div>

        <div className="mt-6">
          {mentor.isAvailable ? (
            <Button onClick={() => setShowRequestModal(true)} leftIcon={<FiMessageSquare size={16} />}>{t.mentorship.requestMentorship}</Button>
          ) : (
            <Button disabled>Currently Not Available</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiClock size={16} />
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{t.mentorship.availability}</h3>
          </div>

          {sortedDays.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">Availability information not provided.</p>
          ) : (
            <div className="space-y-3">
              {sortedDays.map(day => (
                <div key={day}>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{day}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {groupedAvailability[day].map((slot, i) => (
                      <span key={i} className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-tertiary)] px-2 py-1 rounded">
                        {slot.startTime} – {slot.endTime}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">{t.mentorship.stats}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
              <p className="text-2xl font-bold text-primary-500">{mentor.menteesCount}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{t.mentorship.currentMentees}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
              <div className="flex items-center justify-center gap-1">
                <p className="text-2xl font-bold text-primary-500">{mentor.maxMentees}</p>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">{t.mentorship.maxCapacity}</p>
              <div className="mt-1">
                <div className="h-1.5 rounded-full bg-[var(--color-border-primary)] overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', menteeCapacity <= 2 ? 'bg-danger-500' : 'bg-primary-500')}
                    style={{ width: `${(mentor.menteesCount / mentor.maxMentees) * 100}%` }}
                  />
                </div>
                <p className={cn('text-[10px] mt-0.5 font-medium', menteeCapacity <= 2 ? 'text-danger-500' : 'text-accent-500')}>
                  {menteeCapacity} spot{menteeCapacity !== 1 ? 's' : ''} left
                </p>
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
              <p className="text-2xl font-bold text-warning-500">{mentor.rating.toFixed(1)}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{t.mentorship.rating}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
              <p className="text-2xl font-bold text-accent-500">{mentor.reviewsCount}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{t.mentorship.reviews}</p>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} size="md">
        <div className="p-0">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">{t.mentorship.requestMentorship}</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Send a message to {mentor.user.fullName} explaining why you'd like their mentorship.
          </p>

          <Textarea
            placeholder="Tell the mentor about your goals and what you hope to learn..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            className="mb-4"
          />

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowRequestModal(false)}>Cancel</Button>
            <Button onClick={handleRequest} isLoading={requestMentorship.isPending} disabled={!message.trim()}>Send Request</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}