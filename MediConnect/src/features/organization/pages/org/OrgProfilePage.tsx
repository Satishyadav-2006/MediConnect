import { useRef, useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiBriefcase, FiUsers, FiUserPlus, FiGlobe, FiMail, FiPhone, FiMapPin, FiSettings, FiCheckCircle, FiEdit2,
} from 'react-icons/fi'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useOrganization } from '@/features/organization/hooks/useOrganization'
import { useCurrentOrganizationContext } from '@/features/organization/context/CurrentOrganizationContext'
import { organizationService } from '@/api/organizationService'
import { pageTransition } from '@/animations'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import { ROUTES } from '@/constants/routes'
import { formatNumber } from '@/utils'

export default function OrgProfilePage() {
  const { orgId } = useCurrentOrganizationContext()
  const { data: orgData, isLoading } = useOrganization(orgId || '')
  const queryClient = useQueryClient()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null)

  const org = (orgData?.data ?? orgData) as Record<string, unknown> | undefined

  const targetOrgId = orgId || (org?.organization_id as string) || (org?._id as string) || ''

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['organization'] })
    queryClient.invalidateQueries({ queryKey: ['organizations'] })
    queryClient.invalidateQueries({ queryKey: ['currentOrganization'] })
  }, [queryClient])

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, kind: 'logo' | 'banner') => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file || !targetOrgId) return
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      setUploading(kind)
      try {
        if (kind === 'logo') await organizationService.uploadLogo(targetOrgId, file)
        else await organizationService.uploadBanner(targetOrgId, file)
        refresh()
        toast.success(kind === 'logo' ? 'Organization logo updated' : 'Organization banner updated')
      } catch {
        toast.error(`Failed to upload organization ${kind}`)
      } finally {
        setUploading(null)
      }
    },
    [targetOrgId, refresh]
  )

  if (isLoading) {
    return (
      <motion.div {...pageTransition} className="space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </motion.div>
    )
  }

  if (!org) {
    return (
      <motion.div {...pageTransition} className="py-20 text-center text-sm text-[var(--color-text-muted)]">
        Organization profile not found.
      </motion.div>
    )
  }

  const details = [
    { label: 'Type', value: String(org.type || org.organization_type || '').replace(/_/g, ' ') },
    { label: 'Country', value: (org.country as string) || '' },
    { label: 'State', value: (org.state as string) || '' },
    { label: 'City', value: (org.city as string) || '' },
    { label: 'Website', value: (org.website as string) || '', href: org.website as string },
    { label: 'Email', value: (org.email as string) || '', href: org.email ? `mailto:${org.email}` : undefined },
    { label: 'Phone', value: (org.phone as string) || '' },
    { label: 'Founded', value: org.foundedYear ? String(org.foundedYear) : '' },
  ].filter(d => d.value)

  const isVerified = org.isVerified || org.verification_status === 'approved'
  const orgBanner = (org?.banner || org?.coverPhoto || '') as string

  return (
    <motion.div {...pageTransition} className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]">
        <div className="relative h-40 bg-gradient-to-br from-primary-500 to-primary-700">
          <input ref={bannerInputRef} type="file" accept="image/*" onChange={e => handleFile(e, 'banner')} className="hidden" aria-hidden="true" />
          <input ref={logoInputRef} type="file" accept="image/*" onChange={e => handleFile(e, 'logo')} className="hidden" aria-hidden="true" />
          {orgBanner && <img src={orgBanner} alt="" className="h-full w-full object-cover" />}
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            disabled={uploading === 'banner'}
            className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-black/40 px-3 py-1.5 text-xs text-white backdrop-blur-sm hover:bg-black/60 disabled:opacity-60"
          >
            <FiEdit2 size={12} /> {uploading === 'banner' ? 'Uploading...' : 'Edit Banner'}
          </button>
        </div>
        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end justify-between">
            <div className="relative">
              {org.logo ? (
                <img src={org.logo as string} alt="" className="h-24 w-24 rounded-xl border-4 border-[var(--color-bg-primary)] object-cover shadow-md" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-xl border-4 border-[var(--color-bg-primary)] bg-primary-500 shadow-md">
                  <span className="text-3xl font-bold text-white">{String(org.name || '?')[0]}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploading === 'logo'}
                aria-label="Change organization logo"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-bg-primary)] shadow-md hover:bg-[var(--color-bg-hover)] disabled:opacity-60"
              >
                <FiEdit2 size={13} className="text-[var(--color-text-secondary)]" />
              </button>
            </div>
            <Link to={ROUTES.ORG_SETTINGS}>
              <Button size="sm" variant="outline" leftIcon={<FiSettings size={14} />}>Edit Profile</Button>
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{org.name as string}</h1>
            {isVerified && <Badge variant="success" size="sm"><span className="flex items-center gap-1"><FiCheckCircle size={12} />Verified</span></Badge>}
          </div>

          <div className="mt-4 flex flex-wrap gap-6">
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <FiUsers size={16} className="text-primary-500" />
              <span className="font-semibold text-[var(--color-text-primary)]">{formatNumber(Number(org.employeesCount ?? 0))}</span> Employees
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <FiUserPlus size={16} className="text-primary-500" />
              <span className="font-semibold text-[var(--color-text-primary)]">{formatNumber(Number(org.followersCount ?? 0))}</span> Followers
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <FiBriefcase size={16} className="text-primary-500" />
              {Number(org.department_count ?? 0)} Departments
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
          <h2 className="mb-2 text-base font-semibold text-[var(--color-text-primary)]">About</h2>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {org.description ? String(org.description) : 'No description provided yet.'}
          </p>
          {Boolean(org.registration_number) && (
            <p className="mt-4 text-xs text-[var(--color-text-muted)]">Registration Number: {String(org.registration_number)}</p>
          )}
        </section>

        <section className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
          <h2 className="mb-3 text-base font-semibold text-[var(--color-text-primary)]">Contact Information</h2>
          <ul className="space-y-3">
            {details.map(({ label, value, href }) => (
              <li key={label} className="flex items-start gap-3 text-sm">
                {label === 'Website' && <FiGlobe size={16} className="mt-0.5 text-[var(--color-text-muted)]" />}
                {label === 'Email' && <FiMail size={16} className="mt-0.5 text-[var(--color-text-muted)]" />}
                {label === 'Phone' && <FiPhone size={16} className="mt-0.5 text-[var(--color-text-muted)]" />}
                {label === 'Country' || label === 'State' || label === 'City' ? <FiMapPin size={16} className="mt-0.5 text-[var(--color-text-muted)]" /> : null}
                <div className="min-w-0">
                  <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
                  {href ? (
                    <a href={href} target="_blank" rel="noreferrer" className="break-all text-primary-500 hover:text-primary-600">{value}</a>
                  ) : (
                    <p className="break-all text-[var(--color-text-primary)]">{value}</p>
                  )}
                </div>
              </li>
            ))}
            {details.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No contact information available.</p>}
          </ul>
        </section>
      </div>
    </motion.div>
  )
}