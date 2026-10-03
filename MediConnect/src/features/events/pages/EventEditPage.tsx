import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import { eventService } from '@/api/eventService'
import { pageTransition, slideUp } from '@/animations'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'

const eventEditSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(10000),
  mode: z.enum(['online', 'in_person', 'hybrid']),
  startDate: z.string().min(1, 'Start date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endDate: z.string().min(1, 'End date is required'),
  endTime: z.string().min(1, 'End time is required'),
  location: z.string().optional(),
  onlineLink: z.string().optional(),
  maxAttendees: z.number().min(1).optional(),
  registrationDeadline: z.string().optional(),
})

type EventEditFormData = z.infer<typeof eventEditSchema>

interface SpeakerInput {
  name: string
  title: string
  organization: string
}

interface AgendaInput {
  title: string
  description: string
  startTime: string
  endTime: string
}

export default function EventEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventService.getEvent(id || '').then(r => r.data),
    enabled: !!id,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [speakers, setSpeakers] = useState<SpeakerInput[]>([])
  const [agenda, setAgenda] = useState<AgendaInput[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [certificateEnabled, setCertificateEnabled] = useState(false)
  const [certificateRequirements, setCertificateRequirements] = useState('')

  const event = (data?.data?.event || data?.data || data) as any

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<EventEditFormData>({
    resolver: zodResolver(eventEditSchema) as any,
    defaultValues: { mode: 'in_person' },
  })

  useEffect(() => {
    if (event) {
      const startDate = event.startDate ? new Date(event.startDate) : new Date()
      const endDate = event.endDate ? new Date(event.endDate) : new Date()
      reset({
        title: event.title,
        description: event.description,
        mode: event.mode,
        startDate: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endDate: endDate.toISOString().split('T')[0],
        endTime: endDate.toTimeString().slice(0, 5),
        location: event.location,
        onlineLink: event.onlineLink,
        maxAttendees: event.maxAttendees,
        registrationDeadline: event.registrationDeadline?.split('T')[0],
      })
      setSpeakers((event.speakers || []).map((s: any) => ({ name: s.name || '', title: s.title || '', organization: s.organization || '' })))
      setAgenda((event.agenda || []).map((a: any) => ({ title: a.title || '', description: a.description || '', startTime: a.startTime || '', endTime: a.endTime || '' })))
      setTags(event.tags || [])
      if (event.certificateInfo?.enabled) {
        setCertificateEnabled(true)
        setCertificateRequirements(event.certificateInfo.requirements || '')
      }
    }
  }, [event, reset])

  const addSpeaker = () => setSpeakers(prev => [...prev, { name: '', title: '', organization: '' }])
  const removeSpeaker = (index: number) => setSpeakers(prev => prev.filter((_, i) => i !== index))
  const updateSpeaker = (index: number, field: keyof SpeakerInput, value: string) => setSpeakers(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))

  const addAgendaItem = () => setAgenda(prev => [...prev, { title: '', description: '', startTime: '', endTime: '' }])
  const removeAgendaItem = (index: number) => setAgenda(prev => prev.filter((_, i) => i !== index))
  const updateAgendaItem = (index: number, field: keyof AgendaInput, value: string) => setAgenda(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a))

  const addTag = () => { if (tagInput.trim() && !tags.includes(tagInput.trim())) { setTags(prev => [...prev, tagInput.trim()]); setTagInput('') } }
  const removeTag = (index: number) => setTags(prev => prev.filter((_, i) => i !== index))

  const onSubmit = async (formData: EventEditFormData) => {
    setIsSubmitting(true)
    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`).toISOString()
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`).toISOString()
      await eventService.updateEvent(id || '', {
        title: formData.title,
        description: formData.description,
        mode: formData.mode === 'in_person' ? 'offline' : formData.mode,
        start_date: startDateTime,
        end_date: endDateTime,
        location: formData.location || '',
        meeting_link: formData.onlineLink || '',
        max_participants: formData.maxAttendees ?? 0,
        registration_deadline: formData.registrationDeadline ? new Date(formData.registrationDeadline).toISOString() : null,
        tags,
        speakers: speakers.filter(s => s.name.trim()).map(s => s.name),
        agenda: agenda.filter(a => a.title.trim()),
        certificate_available: certificateEnabled,
      })
      toast.success('Event updated successfully')
      navigate(`/events/${id}`)
    } catch {
      toast.error('Failed to update event')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <motion.div {...pageTransition} className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </motion.div>
    )
  }

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">Edit Event</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <motion.div {...slideUp} className="space-y-6">
          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Event Details</h2>
            <Input label="Event Title" {...register('title')} error={errors.title?.message} placeholder="e.g. Medical Conference 2025" />
            <Textarea label="Description" rows={6} {...register('description')} error={errors.description?.message} placeholder="Describe the event..." />
          </div>

          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Date & Time</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Start Date" type="date" {...register('startDate')} error={errors.startDate?.message} />
              <Input label="Start Time" type="time" {...register('startTime')} error={errors.startTime?.message} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="End Date" type="date" {...register('endDate')} error={errors.endDate?.message} />
              <Input label="End Time" type="time" {...register('endTime')} error={errors.endTime?.message} />
            </div>
            <Input label="Registration Deadline" type="date" {...register('registrationDeadline')} />
          </div>

          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Location & Mode</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Mode"
                options={[
                  { value: 'in_person', label: 'In-Person' },
                  { value: 'online', label: 'Online' },
                  { value: 'hybrid', label: 'Hybrid' },
                ]}
                value={watch('mode')}
                onChange={(v) => setValue('mode', v as any)}
              />
              <Input label="Max Attendees" type="number" {...register('maxAttendees', { valueAsNumber: true })} placeholder="e.g. 200" />
            </div>
            {(watch('mode') === 'in_person' || watch('mode') === 'hybrid') && (
              <Input label="Location" {...register('location')} error={errors.location?.message} placeholder="e.g. Convention Center, NYC" />
            )}
            {(watch('mode') === 'online' || watch('mode') === 'hybrid') && (
              <Input label="Meeting Link" {...register('onlineLink')} error={errors.onlineLink?.message} placeholder="https://..." />
            )}
          </div>

          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Speakers</h2>
              <Button type="button" variant="outline" size="sm" leftIcon={<FiPlus size={14} />} onClick={addSpeaker}>Add Speaker</Button>
            </div>
            {speakers.map((speaker, i) => (
              <div key={i} className="rounded-lg border border-[var(--color-border-primary)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">Speaker {i + 1}</span>
                  <button type="button" onClick={() => removeSpeaker(i)} className="text-danger-500 hover:text-danger-600"><FiTrash2 size={14} /></button>
                </div>
                <Input label="Name" value={speaker.name} onChange={e => updateSpeaker(i, 'name', e.target.value)} placeholder="Speaker name" />
                <Input label="Title" value={speaker.title} onChange={e => updateSpeaker(i, 'title', e.target.value)} placeholder="e.g. Chief of Surgery" />
                <Input label="Organization" value={speaker.organization} onChange={e => updateSpeaker(i, 'organization', e.target.value)} placeholder="e.g. Mayo Clinic" />
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Agenda</h2>
              <Button type="button" variant="outline" size="sm" leftIcon={<FiPlus size={14} />} onClick={addAgendaItem}>Add Item</Button>
            </div>
            {agenda.map((item, i) => (
              <div key={i} className="rounded-lg border border-[var(--color-border-primary)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">Item {i + 1}</span>
                  <button type="button" onClick={() => removeAgendaItem(i)} className="text-danger-500 hover:text-danger-600"><FiTrash2 size={14} /></button>
                </div>
                <Input label="Title" value={item.title} onChange={e => updateAgendaItem(i, 'title', e.target.value)} placeholder="Session title" />
                <Textarea label="Description" rows={2} value={item.description} onChange={e => updateAgendaItem(i, 'description', e.target.value)} placeholder="Session description" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Start Time" type="time" value={item.startTime} onChange={e => updateAgendaItem(i, 'startTime', e.target.value)} />
                  <Input label="End Time" type="time" value={item.endTime} onChange={e => updateAgendaItem(i, 'endTime', e.target.value)} />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Tags</h2>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, i) => (
                <Badge key={i} variant="primary" removable onRemove={() => removeTag(i)}>{tag}</Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add a tag..." className="flex-1" />
              <Button type="button" variant="secondary" size="sm" onClick={addTag} disabled={!tagInput.trim()}><FiPlus size={14} /></Button>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Certificate</h2>
            <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <input type="checkbox" checked={certificateEnabled} onChange={e => setCertificateEnabled(e.target.checked)} className="rounded" />
              Offer completion certificate
            </label>
            {certificateEnabled && (
              <Textarea label="Certificate Requirements" rows={3} value={certificateRequirements} onChange={e => setCertificateRequirements(e.target.value)} placeholder="e.g. Must attend all sessions..." />
            )}
          </div>
        </motion.div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>Save Changes</Button>
        </div>
      </form>
    </motion.div>
  )
}
