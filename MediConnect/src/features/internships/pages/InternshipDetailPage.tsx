import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { FiMapPin, FiClock, FiDollarSign, FiBriefcase, FiBookmark, FiShare2, FiArrowLeft, FiCheck } from 'react-icons/fi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { internshipService } from '@/api/internshipService'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import Modal from '@/components/ui/Modal'
import { formatDate, formatCurrency, cn } from '@/utils'
import type { Internship } from '@/types'

export default function InternshipDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showApplyModal, setShowApplyModal] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['internship', id],
    queryFn: () => internshipService.getInternship(id || '').then(r => r.data),
    enabled: !!id,
  })

  const saveMutation = useMutation({
    mutationFn: (isSaved: boolean) => isSaved ? internshipService.unsaveInternship(id || '') : internshipService.saveInternship(id || ''),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['internship', id] })
      qc.invalidateQueries({ queryKey: ['internships'] })
    },
  })

  const applyMutation = useMutation({
    mutationFn: () => internshipService.apply(id || ''),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['internship', id] })
      setShowApplyModal(false)
      toast.success('Application submitted successfully!')
    },
    onError: () => toast.error('Failed to submit application'),
  })

  const internship = (data?.data?.internship || data?.data || data) as Internship

  if (isLoading) {
    return (
      <motion.div {...pageTransition} className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </motion.div>
    )
  }

  if (isError || !internship) {
    return (
      <motion.div {...pageTransition} className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Internship not found</h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">This internship may have been removed.</p>
        <Button onClick={() => navigate(-1)} className="mt-4" variant="outline">Go Back</Button>
      </motion.div>
    )
  }

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-4xl space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
        <FiArrowLeft size={16} /> Back to internships
      </button>

      {internship.status === 'active' && (
        <div className="h-48 w-full rounded-xl bg-gradient-to-r from-primary-500 to-primary-600" />
      )}

      <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-xl bg-[var(--color-bg-tertiary)] flex items-center justify-center shrink-0">
              {internship.organization?.logo ? (
                <img src={internship.organization.logo} alt="" className="h-16 w-16 rounded-xl object-cover" />
              ) : (
                <span className="text-2xl font-bold text-primary-500">{internship.organization?.name?.[0]}</span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{internship.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Link to={`/organizations/${internship.organization?.slug}`} className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                  {internship.organization?.name}
                </Link>
                {internship.organization?.isVerified && <span className="text-primary-500 text-sm">✓</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => saveMutation.mutate(!!internship.isSaved)} leftIcon={<FiBookmark size={14} fill={internship.isSaved ? 'currentColor' : 'none'} />}>
              {internship.isSaved ? 'Saved' : 'Save'}
            </Button>
            <Button variant="ghost" size="sm" leftIcon={<FiShare2 size={14} />}>Share</Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--color-text-secondary)]">
          <span className="flex items-center gap-1"><FiMapPin size={14} />{internship.location || 'Remote'}</span>
          <span className="flex items-center gap-1"><FiClock size={14} />{internship.duration}</span>
          {internship.type && <Badge variant="primary" size="sm">{internship.type}</Badge>}
          {internship.isRemote && <Badge variant="success" size="sm">Remote</Badge>}
          {internship.stipend != null && (
            <span className="flex items-center gap-1">
              <FiDollarSign size={14} />{formatCurrency(internship.stipend)}/mo
            </span>
          )}
          <span className="flex items-center gap-1"><FiClock size={14} />Posted {formatDate(internship.createdAt)}</span>
        </div>

        <div className="mt-6 flex gap-3">
          {internship.hasApplied ? (
            <Button variant="success" disabled leftIcon={<FiCheck size={14} />}>Already Applied</Button>
          ) : (
            <Button onClick={() => setShowApplyModal(true)}>Apply Now</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Description</h2>
            <div className="mt-3 text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">
              {internship.description}
            </div>
          </div>

          {internship.requirements?.length > 0 && (
            <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Requirements</h2>
              <ul className="mt-3 space-y-2">
                {internship.requirements.map((r: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Skills Required</h3>
            <div className="flex flex-wrap gap-2">
              {internship.skills?.map((skill: string) => (
                <Badge key={skill} variant="primary" size="sm">{skill}</Badge>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Duration</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">{internship.duration}</p>
          </div>

          {internship.applicationDeadline && (
            <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Application Deadline</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">{formatDate(internship.applicationDeadline)}</p>
            </div>
          )}

          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">About {internship.organization?.name}</h3>
            <p className="text-sm text-[var(--color-text-secondary)] line-clamp-3">{internship.organization?.description || 'No description available.'}</p>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">{internship.organization?.employeesCount} employees</p>
          </div>
        </div>
      </div>

      <Modal isOpen={showApplyModal} onClose={() => setShowApplyModal(false)} title="Apply for Internship" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Are you sure you want to apply for this internship at {internship.organization?.name}?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowApplyModal(false)}>Cancel</Button>
            <Button onClick={() => applyMutation.mutate()} isLoading={applyMutation.isPending}>Confirm Application</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
