import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useQuery, useMutation } from '@tanstack/react-query'
import { mentorService } from '@/api/mentorService'
import { pageTransition, slideUp } from '@/animations'
import Button from '@/components/ui/Button'
import Textarea from '@/components/ui/Textarea'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Skeleton from '@/components/ui/Skeleton'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { SPECIALIZATIONS } from '@/constants'
import { useRequestMentorship } from '@/features/mentorship/hooks/useMentors'

export default function RequestMentorPage() {
  const { mentorId } = useParams<{ mentorId: string }>()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [preferredSchedule, setPreferredSchedule] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['mentor', mentorId],
    queryFn: () => mentorService.getMentor(mentorId || '').then(r => r.data),
    enabled: !!mentorId,
  })

  const requestMentorship = useRequestMentorship()

  const mentor = (data?.data?.mentor || data?.data || data) as any

  const handleSubmit = () => {
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }
    requestMentorship.mutate(
      { mentorId: mentorId || '', message: `${message}\n\nSpecialization: ${specialization}\nPreferred Schedule: ${preferredSchedule}` },
      {
        onSuccess: () => {
          setSubmitted(true)
          toast.success('Mentorship request sent!')
        },
        onError: () => toast.error('Failed to send request'),
      }
    )
  }

  if (isLoading) {
    return (
      <motion.div {...pageTransition} className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </motion.div>
    )
  }

  if (submitted) {
    return (
      <motion.div {...pageTransition} className="mx-auto max-w-2xl flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-accent-50 flex items-center justify-center mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Request Sent!</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)] text-center max-w-md">
          Your mentorship request has been sent to {mentor?.user?.fullName || 'the mentor'}. You will be notified when they respond.
        </p>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => navigate('/mentors')}>Back to Mentors</Button>
          <Button onClick={() => navigate('/mentors/requests')}>View My Requests</Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Request Mentorship</h1>

      {mentor && (
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
          <div className="flex items-center gap-4">
            <Avatar name={mentor.user?.fullName} src={mentor.user?.profilePhoto} size="lg" />
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{mentor.user?.fullName}</h2>
              <p className="text-sm text-[var(--color-text-secondary)]">{mentor.user?.specialization || mentor.user?.headline}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {mentor.specializations?.map((s: string) => (
                  <Badge key={s} variant="primary" size="sm">{s}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <motion.div {...slideUp} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Your Request</h2>

        <Textarea
          label="Message"
          rows={5}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Introduce yourself and explain why you'd like this mentorship. What are your goals?"
        />

        <Select
          label="Area of Specialization"
          options={SPECIALIZATIONS.map(s => ({ value: s, label: s }))}
          value={specialization}
          onChange={setSpecialization}
          placeholder="Select your focus area"
        />

        <Input
          label="Preferred Schedule"
          value={preferredSchedule}
          onChange={e => setPreferredSchedule(e.target.value)}
          placeholder="e.g. Weekday evenings, Saturday mornings"
        />
      </motion.div>

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
        <Button onClick={handleSubmit} isLoading={requestMentorship.isPending}>Send Request</Button>
      </div>
    </motion.div>
  )
}
