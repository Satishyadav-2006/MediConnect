import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { FiPlus } from 'react-icons/fi'
import { pageTransition, slideUp } from '@/animations'
import { internshipService } from '@/api/internshipService'
import { SKILLS } from '@/constants/options'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import { useQuery } from '@tanstack/react-query'

const internshipEditSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(10000),
  duration: z.string().min(1, 'Duration is required'),
  stipend: z.number().min(0).optional(),
  currency: z.string().default('USD'),
  location: z.string().optional(),
  isRemote: z.boolean().default(false),
  mode: z.enum(['online', 'offline', 'hybrid']),
  applicationDeadline: z.string().optional(),
  eligibility: z.string().optional(),
  certificateInfo: z.string().optional(),
})

type InternshipEditFormData = z.infer<typeof internshipEditSchema>

function ListItemInput({
  label, value, onChange, list, onAdd, onRemove,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  list: string[]
  onAdd: () => void
  onRemove: (index: number) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {list.map((item, i) => (
          <Badge key={i} variant="primary" removable onRemove={() => onRemove(i)}>{item}</Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={value} onChange={e => onChange(e.target.value)} placeholder={`Add ${label.toLowerCase()}...`} className="flex-1" />
        <Button type="button" variant="secondary" size="sm" onClick={onAdd} disabled={!value.trim()}>
          <FiPlus size={14} />
        </Button>
      </div>
    </div>
  )
}

export default function InternshipEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['internship', id],
    queryFn: () => internshipService.getInternship(id || '').then(r => r.data),
    enabled: !!id,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requirements, setRequirements] = useState<string[]>([])
  const [responsibilities, setResponsibilities] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [reqInput, setReqInput] = useState('')
  const [respInput, setRespInput] = useState('')

  const internship = (data?.data?.internship || data?.data || data) as any

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<InternshipEditFormData>({
    resolver: zodResolver(internshipEditSchema) as any,
    defaultValues: {
      isRemote: false,
      currency: 'USD',
      mode: 'online',
    },
  })

  useEffect(() => {
    if (internship) {
      reset({
        title: internship.title,
        description: internship.description,
        duration: internship.duration,
        stipend: internship.stipend,
        currency: internship.currency || 'USD',
        location: internship.location,
        isRemote: internship.isRemote,
        mode: internship.mode || 'online',
        applicationDeadline: internship.applicationDeadline?.split('T')[0],
        eligibility: internship.eligibility,
        certificateInfo: internship.certificateInfo,
      })
      setRequirements(internship.requirements || [])
      setResponsibilities(internship.responsibilities || [])
      setSkills(internship.skills || [])
    }
  }, [internship, reset])

  const addListItem = (value: string, list: string[], setter: (v: string[]) => void) => {
    if (value.trim() && !list.includes(value.trim())) {
      setter([...list, value.trim()])
    }
  }

  const removeListItem = (index: number, list: string[], setter: (v: string[]) => void) => {
    setter(list.filter((_, i) => i !== index))
  }

  const onSubmit = async (formData: InternshipEditFormData) => {
    setIsSubmitting(true)
    try {
      const durationStr = (formData.duration || '').toLowerCase()
      const durationNum = parseFloat(formData.duration || '') || 0
      const duration_weeks = durationStr.includes('month') ? Math.round(durationNum * 4) : Math.round(durationNum)
      await internshipService.updateInternship(id || '', {
        title: formData.title,
        description: formData.description,
        location: formData.location || '',
        work_mode: formData.mode === 'online' ? 'remote' : formData.mode === 'offline' ? 'onsite' : 'hybrid',
        duration_weeks,
        stipend: Number.isFinite(formData.stipend) ? formData.stipend ?? 0 : 0,
        skills_required: skills,
        eligibility: formData.eligibility || '',
        application_deadline: formData.applicationDeadline || null,
        requirements,
        responsibilities,
      })
      toast.success('Internship updated successfully')
      navigate(`/internships/${id}`)
    } catch {
      toast.error('Failed to update internship')
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
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">Edit Internship</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <motion.div {...slideUp} className="space-y-6">
          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Internship Details</h2>
            <Input label="Title" {...register('title')} error={errors.title?.message} placeholder="e.g. Medical Research Intern" />
            <Textarea label="Description" rows={6} {...register('description')} error={errors.description?.message} placeholder="Describe the internship..." />
          </div>

          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Duration & Compensation</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Duration" {...register('duration')} error={errors.duration?.message} placeholder="e.g. 3 months" />
              <Input label="Stipend" type="number" {...register('stipend', { valueAsNumber: true })} placeholder="e.g. 1500" />
            </div>
            <Input label="Currency" {...register('currency')} placeholder="USD" />
          </div>

          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Location & Mode</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Location" {...register('location')} placeholder="e.g. New York, NY" />
              <Select
                label="Mode"
                options={[
                  { value: 'online', label: 'Online' },
                  { value: 'offline', label: 'In-Person' },
                  { value: 'hybrid', label: 'Hybrid' },
                ]}
                value={watch('mode')}
                onChange={(v) => setValue('mode', v as any)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <input type="checkbox" {...register('isRemote')} className="rounded" />
              Remote available
            </label>
            <Input label="Application Deadline" type="date" {...register('applicationDeadline')} />
          </div>

          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Requirements & Responsibilities</h2>
            <ListItemInput label="Requirements" value={reqInput} onChange={setReqInput} list={requirements} onAdd={() => { addListItem(reqInput, requirements, setRequirements); setReqInput('') }} onRemove={(i) => removeListItem(i, requirements, setRequirements)} />
            <ListItemInput label="Responsibilities" value={respInput} onChange={setRespInput} list={responsibilities} onAdd={() => { addListItem(respInput, responsibilities, setResponsibilities); setRespInput('') }} onRemove={(i) => removeListItem(i, responsibilities, setResponsibilities)} />
          </div>

          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Additional Info</h2>
            <Textarea label="Eligibility" rows={3} {...register('eligibility')} placeholder="e.g. Must be enrolled in medical school..." />
            <Textarea label="Certificate Info" rows={3} {...register('certificateInfo')} placeholder="Details about the completion certificate..." />
          </div>

          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Skills Required</h2>
            <div className="flex flex-wrap gap-2 mb-2">
              {skills.map((skill, i) => (
                <Badge key={i} variant="primary" removable onRemove={() => removeListItem(i, skills, setSkills)}>{skill}</Badge>
              ))}
            </div>
            <Select
              options={SKILLS.filter(s => !skills.includes(s)).map(s => ({ value: s, label: s }))}
              value=""
              onChange={(v) => { if (v) setSkills(prev => [...prev, v]) }}
              placeholder="Add skills..."
            />
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
