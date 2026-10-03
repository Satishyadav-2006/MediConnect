import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { FiPlus } from 'react-icons/fi'
import { jobSchema, type JobFormData } from '@/validators'
import { EMPLOYMENT_TYPES, EXPERIENCE_LEVELS } from '@/constants'
import { pageTransition, slideUp } from '@/animations'
import { jobService } from '@/api/jobService'
import { SKILLS } from '@/constants/options'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import { useJob } from '@/features/jobs/hooks/useJobs'

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

export default function JobEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useJob(id || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requirements, setRequirements] = useState<string[]>([])
  const [responsibilities, setResponsibilities] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [benefits, setBenefits] = useState<string[]>([])
  const [reqInput, setReqInput] = useState('')
  const [respInput, setRespInput] = useState('')
  const [benefitInput, setBenefitInput] = useState('')

  const job = (data?.data?.job || data?.data || data) as any

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<JobFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(jobSchema) as any,
    defaultValues: {
      employmentType: 'full_time',
      experienceLevel: 'mid',
      isRemote: false,
      currency: 'USD',
      requirements: [],
      responsibilities: [],
      skills: [],
      benefits: [],
    },
  })

  useEffect(() => {
    if (job) {
      reset({
        title: job.title,
        description: job.description,
        employmentType: job.employmentType,
        experienceLevel: job.experienceLevel,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        currency: job.currency || 'USD',
        isRemote: job.isRemote,
        location: job.location,
        applicationDeadline: job.applicationDeadline?.split('T')[0],
      })
      setRequirements(job.requirements || [])
      setResponsibilities(job.responsibilities || [])
      setSkills(job.skills || [])
      setBenefits(job.benefits || [])
    }
  }, [job, reset])

  const addListItem = (value: string, list: string[], setter: (v: string[]) => void, field: keyof JobFormData) => {
    if (value.trim() && !list.includes(value.trim())) {
      const updated = [...list, value.trim()]
      setter(updated)
      setValue(field, updated as any)
    }
  }

  const removeListItem = (index: number, list: string[], setter: (v: string[]) => void, field: keyof JobFormData) => {
    const updated = list.filter((_, i) => i !== index)
    setter(updated)
    setValue(field, updated as any)
  }

  const onSubmit = async (data: JobFormData) => {
    setIsSubmitting(true)
    try {
      const payload = {
        title: data.title,
        description: data.description,
        requirements,
        responsibilities,
        department: '',
        location: data.location || '',
        work_mode: data.isRemote ? 'remote' : 'onsite',
        job_type: data.employmentType,
        experience_level: data.experienceLevel,
        skills_required: skills,
        salary_range: {
          minimum_salary: Number.isFinite(data.salaryMin) ? data.salaryMin ?? 0 : 0,
          maximum_salary: Number.isFinite(data.salaryMax) ? data.salaryMax ?? 0 : 0,
          currency: data.currency || 'USD',
        },
        application_deadline: data.applicationDeadline || null,
      }
      await jobService.updateJob(id || '', payload)
      toast.success('Job updated successfully')
      navigate(`/jobs/${id}`)
    } catch {
      toast.error('Failed to update job')
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
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">Edit Job Posting</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <motion.div {...slideUp} className="space-y-6">
          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Job Details</h2>
            <Input label="Job Title" {...register('title')} error={errors.title?.message} placeholder="e.g. Registered Nurse - ICU" />
            <Textarea label="Description" rows={6} {...register('description')} error={errors.description?.message} placeholder="Describe the role..." />
          </div>

          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Requirements & Responsibilities</h2>
            <ListItemInput label="Requirements" value={reqInput} onChange={setReqInput} list={requirements} onAdd={() => { addListItem(reqInput, requirements, setRequirements, 'requirements'); setReqInput('') }} onRemove={(i) => removeListItem(i, requirements, setRequirements, 'requirements')} />
            <ListItemInput label="Responsibilities" value={respInput} onChange={setRespInput} list={responsibilities} onAdd={() => { addListItem(respInput, responsibilities, setResponsibilities, 'responsibilities'); setRespInput('') }} onRemove={(i) => removeListItem(i, responsibilities, setResponsibilities, 'responsibilities')} />
          </div>

          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Employment Info</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Employment Type"
                options={EMPLOYMENT_TYPES.map(t => ({ value: t.value, label: t.label }))}
                value={watch('employmentType')}
                onChange={(v) => setValue('employmentType', v as any)}
              />
              <Select
                label="Experience Level"
                options={EXPERIENCE_LEVELS.map(l => ({ value: l.value, label: l.label }))}
                value={watch('experienceLevel')}
                onChange={(v) => setValue('experienceLevel', v as any)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Salary Minimum" type="number" {...register('salaryMin', { valueAsNumber: true })} error={errors.salaryMin?.message} placeholder="e.g. 50000" />
              <Input label="Salary Maximum" type="number" {...register('salaryMax', { valueAsNumber: true })} error={errors.salaryMax?.message} placeholder="e.g. 80000" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Location" {...register('location')} placeholder="e.g. New York, NY" />
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] pt-6">
                <input type="checkbox" {...register('isRemote')} className="rounded" />
                Remote position
              </label>
            </div>
            <Input label="Application Deadline" type="date" {...register('applicationDeadline')} />
          </div>

          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Skills & Benefits</h2>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Required Skills</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {skills.map((skill, i) => (
                  <Badge key={i} variant="primary" removable onRemove={() => removeListItem(i, skills, setSkills, 'skills')}>{skill}</Badge>
                ))}
              </div>
              <Select
                options={SKILLS.filter(s => !skills.includes(s)).map(s => ({ value: s, label: s }))}
                value=""
                onChange={(v) => { if (v) { const updated = [...skills, v]; setSkills(updated); setValue('skills', updated as any) } }}
                placeholder="Add skills..."
              />
            </div>
            <ListItemInput label="Benefits" value={benefitInput} onChange={setBenefitInput} list={benefits} onAdd={() => { addListItem(benefitInput, benefits, setBenefits, 'benefits'); setBenefitInput('') }} onRemove={(i) => removeListItem(i, benefits, setBenefits, 'benefits')} />
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
