import { useState } from 'react'
import { useI18n } from '@/config/i18n'
import toast from 'react-hot-toast'
import { FiCalendar, FiClock, FiPlus, FiStar, FiX } from 'react-icons/fi'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { cn, formatDate } from '@/utils'
import { useMentorshipSessions, useScheduleSession, useCancelSession, useCompleteSession, useSessionFeedback } from '@/features/mentorship/hooks/useMentors'
import type { MentorSession } from '@/types'

const DURATIONS = [30, 45, 60, 90, 120]

const statusBadge: Record<MentorSession['status'], 'info' | 'success' | 'default'> = {
  scheduled: 'info',
  completed: 'success',
  cancelled: 'default',
}

function RatingBadge({ session }: { session: MentorSession }) {
  if (session.status !== 'completed' || !session.rating) return null
  return (
    <span className="flex items-center gap-1 text-xs text-warning-500">
      <FiStar size={12} fill="currentColor" /> {session.rating}/5
    </span>
  )
}

interface Props {
  mentorshipId: string
}

export default function MentorshipSessions({ mentorshipId }: Props) {
  const { t } = useI18n()
  const { data, isLoading } = useMentorshipSessions(mentorshipId)
  const schedule = useScheduleSession(mentorshipId)
  const cancel = useCancelSession(mentorshipId)
  const complete = useCompleteSession(mentorshipId)
  const feedback = useSessionFeedback(mentorshipId)

  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [duration, setDuration] = useState('45')
  const [topic, setTopic] = useState('')
  const [feedbackFor, setFeedbackFor] = useState<MentorSession | null>(null)
  const [rating, setRating] = useState(0)
  const [feedbackText, setFeedbackText] = useState('')

  const sessions: MentorSession[] = data?.items ?? []

  const handleSchedule = async () => {
    if (!scheduledAt) {
      toast.error(t.mentorship.dateTimeLabel + ' is required')
      return
    }
    try {
      await schedule.mutateAsync({
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration_minutes: Number(duration),
        topic: topic.trim() || 'General session',
      })
      setShowSchedule(false)
      setScheduledAt('')
      setTopic('')
      toast.success(t.mentorship.sessionScheduled)
    } catch {
      toast.error(t.mentorship.sessionScheduled + ' failed')
    }
  }

  const handleCancel = async (session: MentorSession) => {
    try {
      await cancel.mutateAsync(session._id)
      toast.success(t.mentorship.sessionCancelled)
    } catch {
      toast.error(t.mentorship.sessionCancelled + ' failed')
    }
  }

  const handleComplete = async (session: MentorSession) => {
    try {
      await complete.mutateAsync(session._id)
      toast.success(t.mentorship.sessionCompleted)
    } catch {
      toast.error(t.mentorship.sessionCompleted + ' failed')
    }
  }

  const handleFeedback = async () => {
    if (!feedbackFor || rating < 1) {
      toast.error('Please select a rating')
      return
    }
    try {
      await feedback.mutateAsync({
        sessionId: feedbackFor._id,
        rating,
        feedback: feedbackText.trim(),
      })
      setFeedbackFor(null)
      setRating(0)
      setFeedbackText('')
      toast.success(t.mentorship.feedbackSubmitted)
    } catch {
      toast.error(t.mentorship.feedbackSubmitted + ' failed')
    }
  }

  return (
    <div className="border-t border-[var(--color-border-primary)] pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <FiCalendar size={14} /> {t.mentorship.sessions}
        </h4>
        <Button size="sm" leftIcon={<FiPlus size={14} />} onClick={() => setShowSchedule(true)}>
          {t.mentorship.scheduleSession}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-xs text-[var(--color-text-muted)]">Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">{t.mentorship.noSessions}</p>
      ) : (
        <div className="space-y-2">
          {sessions.map(session => (
            <div key={session._id} className={cn('rounded-lg border border-[var(--color-border-primary)] p-3', session.status === 'cancelled' && 'opacity-60')}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{session.topic}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1">
                      <FiCalendar size={11} />
                      {session.scheduledAt ? formatDate(session.scheduledAt) : '—'}
                    </span>
                    <span className="flex items-center gap-1"><FiClock size={11} />{session.duration} min</span>
                    <RatingBadge session={session} />
                  </div>
                  {session.feedback && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 line-clamp-2">"{session.feedback}"</p>
                  )}
                  {session.meeting_link && (
                    <a href={session.meeting_link} target="_blank" rel="noreferrer" className="text-xs text-primary-500 hover:underline mt-1 inline-block">
                      {session.meeting_link}
                    </a>
                  )}
                </div>
                <Badge variant={statusBadge[session.status]} size="sm">{session.status}</Badge>
              </div>
              {session.status === 'scheduled' && (
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleComplete(session)}
                    isLoading={complete.isPending}
                  >
                    {t.mentorship.markCompleted}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setFeedbackFor(session)}>
                    {t.mentorship.feedbackTitle}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<FiX size={13} />}
                    onClick={() => handleCancel(session)}
                    disabled={cancel.isPending}
                  >
                    {t.mentorship.cancelSession}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showSchedule} onClose={() => setShowSchedule(false)} size="sm">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{t.mentorship.scheduleModalTitle}</h3>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">{t.mentorship.dateTimeLabel}</label>
            <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">{t.mentorship.durationLabel}</label>
            <Select
              options={DURATIONS.map(d => ({ value: String(d), label: `${d} min` }))}
              value={duration}
              onChange={setDuration}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">{t.mentorship.topicLabel}</label>
            <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Career guidance session" />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="ghost" onClick={() => setShowSchedule(false)}>Cancel</Button>
            <Button onClick={handleSchedule} isLoading={schedule.isPending}>{t.mentorship.scheduleSession}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!feedbackFor} onClose={() => setFeedbackFor(null)} size="sm">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{t.mentorship.feedbackTitle}</h3>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={cn('rounded-lg p-2 text-2xl transition-colors', rating >= n ? 'text-warning-500' : 'text-[var(--color-text-muted)] hover:text-warning-300')}
                aria-label={`${n} stars`}
              >
                <FiStar fill="currentColor" />
              </button>
            ))}
          </div>
          <Textarea
            rows={4}
            placeholder={t.mentorship.feedbackLabel}
            value={feedbackText}
            onChange={e => setFeedbackText(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setFeedbackFor(null)}>Cancel</Button>
            <Button onClick={handleFeedback} isLoading={feedback.isPending}>{t.mentorship.submitFeedback}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}