import { useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { FiSave, FiUpload, FiArrowLeft } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useOrganization, useUpdateOrganization } from '@/features/organization/hooks/useOrganization'
import { organizationService } from '@/api/organizationService'
import { useResolvedOrgId } from '@/features/organization/context/CurrentOrganizationContext'
import { ROUTES } from '@/constants/routes'
import { ORG_TYPES } from '@/features/organization/constants'
import { pageTransition } from '@/animations'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import Skeleton from '@/components/ui/Skeleton'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  location: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  type: z.string().min(1, 'Type is required'),
  foundedYear: z.coerce.number().min(1900).max(new Date().getFullYear()).optional(),
  specializations: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function OrganizationEditPage() {
  const { id } = useParams<{ id?: string }>()
  const orgId = useResolvedOrgId()
  const navigate = useNavigate()
  const { data: orgData, isLoading } = useOrganization(`${id || orgId || ''}`)
  const updateMutation = useUpdateOrganization(`${id || orgId || ''}`)

  const org = (orgData?.data || orgData) as Record<string, unknown> | undefined

  const queryClient = useQueryClient()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)

  const orgBanner = (org?.banner || org?.coverPhoto || '') as string
  const targetOrgId = id || orgId || (org?.organization_id as string) || (org?._id as string) || ''

  const refreshOrg = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['organization'] })
    queryClient.invalidateQueries({ queryKey: ['organizations'] })
  }, [queryClient])

  const handleLogoSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file || !targetOrgId) return
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      setIsUploadingLogo(true)
      try {
        await organizationService.uploadLogo(targetOrgId, file)
        refreshOrg()
        toast.success('Organization logo updated')
      } catch {
        toast.error('Failed to upload organization logo')
      } finally {
        setIsUploadingLogo(false)
      }
    },
    [targetOrgId, refreshOrg]
  )

  const handleBannerSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file || !targetOrgId) return
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      setIsUploadingBanner(true)
      try {
        await organizationService.uploadBanner(targetOrgId, file)
        refreshOrg()
        toast.success('Organization banner updated')
      } catch {
        toast.error('Failed to upload organization banner')
      } finally {
        setIsUploadingBanner(false)
      }
    },
    [targetOrgId, refreshOrg]
  )

  const { register, handleSubmit, formState: { errors, isDirty }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    values: org ? {
      name: (org.name as string) || '',
      description: (org.description as string) || '',
      website: (org.website as string) || '',
      email: (org.email as string) || '',
      phone: (org.phone as string) || '',
      location: (org.location as string) || '',
      country: (org.country as string) || '',
      state: (org.state as string) || '',
      city: (org.city as string) || '',
      type: (org.type as string) || '',
      foundedYear: org.foundedYear as number | undefined,
      specializations: Array.isArray(org.specializations) ? (org.specializations as string[]).join(', ') : '',
    } : undefined,
  })

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      specializations: data.specializations ? data.specializations.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      foundedYear: data.foundedYear || undefined,
    }
    updateMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Organization updated successfully')
        navigate(id ? `/organizations/${id}` : ROUTES.ORG_PROFILE)
      },
      onError: () => toast.error('Failed to update organization'),
    })
  }

  if (isLoading) {
    return (
      <motion.div {...pageTransition} className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </motion.div>
    )
  }

  if (!org) {
    return (
      <motion.div {...pageTransition} className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-[var(--color-text-muted)]">Organization not found.</p>
      </motion.div>
    )
  }

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]">
          <FiArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Edit Organization</h1>
      </div>

      <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] overflow-hidden">
        <div className="h-32 bg-gradient-to-br from-primary-500 to-primary-700 relative">
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerSelected}
            className="hidden"
            aria-hidden="true"
          />
          {!!orgBanner && (
            <img src={orgBanner} alt="" className="h-full w-full object-cover" />
          )}
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            disabled={isUploadingBanner}
            className="absolute bottom-3 right-3 rounded-lg bg-black/40 px-3 py-1.5 text-xs text-white hover:bg-black/60 flex items-center gap-1.5 disabled:opacity-60"
          >
            <FiUpload size={12} />{isUploadingBanner ? 'Uploading...' : 'Change Banner'}
          </button>
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-8 mb-4">
            <div className="relative">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoSelected}
                className="hidden"
                aria-hidden="true"
              />
              {(org as Record<string, unknown>).logo ? (
                <img src={(org as Record<string, unknown>).logo as string} alt="" className="h-20 w-20 rounded-xl border-3 border-[var(--color-bg-primary)] object-cover shadow-md" />
              ) : (
                <div className="h-20 w-20 rounded-xl border-3 border-[var(--color-bg-primary)] bg-primary-500 flex items-center justify-center shadow-md">
                  <span className="text-2xl font-bold text-white">{((org as Record<string, unknown>).name as string)?.[0]}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={isUploadingLogo}
                aria-label="Change organization logo"
                className="absolute bottom-0 right-0 rounded-full bg-[var(--color-bg-primary)] p-1.5 shadow-md hover:bg-[var(--color-bg-hover)] disabled:opacity-60"
              >
                <FiUpload size={12} className="text-[var(--color-text-secondary)]" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Organization Name"
              {...register('name')}
              error={errors.name?.message}
            />

            <Textarea
              label="Description"
              {...register('description')}
              rows={4}
              placeholder="Describe your organization..."
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Type"
                options={[...ORG_TYPES]}
                value={watch('type')}
                onChange={(v) => setValue('type', v)}
                placeholder="Select type"
              />
              <Input
                label="Founded Year"
                type="number"
                {...register('foundedYear')}
                error={errors.foundedYear?.message}
                placeholder="e.g. 2010"
              />
            </div>

            <Input
              label="Website"
              {...register('website')}
              error={errors.website?.message}
              placeholder="https://example.com"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                {...register('email')}
                error={errors.email?.message}
              />
              <Input
                label="Phone"
                {...register('phone')}
              />
            </div>

            <Input
              label="Location"
              {...register('location')}
              placeholder="City, Country"
            />

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="City"
                {...register('city')}
              />
              <Input
                label="State"
                {...register('state')}
              />
              <Input
                label="Country"
                {...register('country')}
              />
            </div>

            <Textarea
              label="Specializations"
              {...register('specializations')}
              rows={2}
              placeholder="Comma-separated, e.g. Cardiology, Neurology"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" isLoading={updateMutation.isPending} leftIcon={<FiSave size={16} />}>Save Changes</Button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  )
}
