import { useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { FiPlus } from 'react-icons/fi'
import { EMPLOYMENT_TYPES } from '@/constants'
import { pageTransition, slideUp } from '@/animations'
import { internshipService } from '@/api/internshipService'
import { SKILLS } from '@/constants/options'
import { useOptionalCurrentOrganization } from '@/features/organization/context/CurrentOrganizationContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'

const internshipSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(10000),
  organizationId: z.string().min(1, 'Organization is required'),
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

type InternshipFormData = z.infer<typeof internshipSchema>

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

export default function InternshipCreatePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const workspaceOrg = useOptionalCurrentOrganization()
  const orgId = searchParams.get('org') || workspaceOrg?.orgId || ''
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requirements, setRequirements] = useState<string[]>([])
  const [responsibilities, setResponsibilities] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [reqInput, setReqInput] = useState('')
  const [respInput, setRespInput] = useState('')

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<InternshipFormData>({
    resolver: zodResolver(internshipSchema) as any,
    defaultValues: {
      isRemote: false,
      currency: 'USD',
      mode: 'online',
      organizationId: orgId,
    },
  })

  const addListItem = (value: string, list: string[], setter: (v: string[]) => void) => {
    if (value.trim() && !list.includes(value.trim())) {
      setter([...list, value.trim()])
    }
  }

  const removeListItem = (index: number, list: string[], setter: (v: string[]) => void) => {
    setter(list.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: InternshipFormData) => {
    if (requirements.length === 0) {
      toast.error('Add at least one requirement')
      return
    }
    setIsSubmitting(true)
    try {
      const durationStr = (data.duration || '').toLowerCase()
      const durationNum = parseFloat(data.duration || '') || 0
      const duration_weeks = durationStr.includes('month') ? Math.round(durationNum * 4) : Math.round(durationNum)
      const payload = {
        title: data.title,
        description: data.description,
        organization_id: data.organizationId,
        department: '',
        location: data.location || '',
        work_mode: data.mode === 'online' ? 'remote' : data.mode === 'offline' ? 'onsite' : 'hybrid',
        internship_type: 'clinical',
        duration_weeks,
        stipend: Number.isFinite(data.stipend) ? data.stipend ?? 0 : 0,
        currency: data.currency || 'USD',
        skills_required: skills,
        eligibility: data.eligibility || '',
        max_participants: 0,
        is_paid: (data.stipend || 0) > 0,
        application_deadline: data.applicationDeadline || null,
      }
      const result = await internshipService.createInternship(payload)
      toast.success('Internship created successfully')
      const id = result.data?.data?._id || result.data?._id || ''
      navigate(location.pathname.startsWith('/org') ? `/org/internships/${id}` : `/internships/${id}`)
    } catch {
      toast.error('Failed to create internship')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">Create Internship</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <motion.div {...slideUp} className="space-y-6">
          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Internship Details</h2>
            <Input label="Title" {...register('title')} error={errors.title?.message} placeholder="e.g. Medical Research Intern" />
            <Textarea label="Description" rows={6} {...register('description')} error={errors.description?.message} placeholder="Describe the internship..." />
            <Input label="Organization ID" {...register('organizationId')} error={errors.organizationId?.message} placeholder="Organization ID" />
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
          <Button type="submit" isLoading={isSubmitting}>Create Internship</Button>
        </div>
      </form>
    </motion.div>
  )
}
