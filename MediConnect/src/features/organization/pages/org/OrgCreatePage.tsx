import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { FiArrowLeft, FiPlus, FiShield, FiInfo } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { organizationService } from '@/api/organizationService'
import { ROUTES } from '@/constants/routes'
import { ORG_TYPES } from '@/features/organization/constants'
import { pageTransition } from '@/animations'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  organization_type: z.string().min(1, 'Organization type is required'),
  registration_number: z.string().optional(),
  description: z.string().max(5000, 'Description is too long').optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State is required'),
  city: z.string().min(1, 'City is required'),
  address: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function OrgCreatePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: '',
      organization_type: '',
      registration_number: '',
      description: '',
      website: '',
      email: '',
      phone: '',
      country: '',
      state: '',
      city: '',
      address: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => organizationService.create(data),
    onSuccess: () => {
      toast.success('Organization created successfully')
      qc.invalidateQueries({ queryKey: ['currentOrganization'] })
      navigate(ROUTES.ORG_DASHBOARD)
    },
    onError: () => toast.error('Failed to create organization. Please try again.'),
  })

  const onSubmit = (data: FormData) => {
    createMutation.mutate({
      ...data,
      description: data.description || '',
      registration_number: data.registration_number || '',
    })
  }

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]" aria-label="Go back">
          <FiArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Create Organization</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Set up your hospital or institution profile to unlock the organization workspace.</p>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] p-3.5 text-sm text-[var(--color-text-secondary)]">
        <FiShield size={16} className="mt-0.5 shrink-0 text-primary-500" />
        <p>
          This creates the official organization record for your account. Admins will review your registration details before your profile is verified, but your workspace becomes available right away.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
        <Input
          label="Organization Name *"
          {...register('name')}
          error={errors.name?.message}
          placeholder="e.g. City General Hospital"
        />

        <Select
          label="Organization Type *"
          options={[...ORG_TYPES]}
          value={watch('organization_type')}
          onChange={(v) => setValue('organization_type', v)}
          placeholder="Select type"
        />
        {errors.organization_type && (
          <p className="!mt-1 text-xs text-red-500">{errors.organization_type.message}</p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Registration Number"
            {...register('registration_number')}
            error={errors.registration_number?.message}
            placeholder="Registration / license number"
          />
          <Input
            label="Phone"
            {...register('phone')}
            placeholder="e.g. +1 555 123 4567"
          />
        </div>

        <Textarea
          label="Description"
          {...register('description')}
          rows={4}
          placeholder="Describe your organization, services, and mission..."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Website"
            {...register('website')}
            error={errors.website?.message}
            placeholder="https://example.com"
          />
          <Input
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="contact@example.com"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Country *" {...register('country')} error={errors.country?.message} placeholder="e.g. India" />
          <Input label="State *" {...register('state')} error={errors.state?.message} placeholder="e.g. Maharashtra" />
          <Input label="City *" {...register('city')} error={errors.city?.message} placeholder="e.g. Mumbai" />
        </div>

        <Input
          label="Address"
          {...register('address')}
          placeholder="Street, building, area"
        />

        <div className="flex items-start gap-2 rounded-lg bg-[var(--color-bg-tertiary)] p-3 text-xs text-[var(--color-text-secondary)]">
          <FiInfo size={14} className="mt-0.5 shrink-0" />
          <p>Organization records are stored separately from your user account. Only the owner account can manage this organization.</p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" isLoading={createMutation.isPending} leftIcon={<FiPlus size={16} />}>
            Create Organization
          </Button>
        </div>
      </form>
    </motion.div>
  )
}