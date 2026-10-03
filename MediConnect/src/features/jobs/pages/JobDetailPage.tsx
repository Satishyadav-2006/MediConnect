import { useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMapPin, FiClock, FiDollarSign, FiBriefcase, FiGlobe, FiBookmark, FiShare2, FiArrowLeft, FiMessageSquare, FiFileText, FiX, FiCheckCircle, FiUpload } from 'react-icons/fi'
import { useJob, useSaveJob, useApplyJob } from '@/features/jobs/hooks/useJobs'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Skeleton from '@/components/ui/Skeleton'
import Textarea from '@/components/ui/Textarea'
import Modal from '@/components/ui/Modal'
import { cn, formatDate, formatCurrency, getStatusColor } from '@/utils'

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, isError } = useJob(id || '')
  const saveJob = useSaveJob()
  const applyJob = useApplyJob()

  const [showApplyModal, setShowApplyModal] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [additionalAnswers, setAdditionalAnswers] = useState<Record<string, string>>({})
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)
  const resumeInputRef = useRef<HTMLInputElement>(null)

  const job = (data?.data?.job || data?.data || data) as any

  const additionalQuestions = [
    { id: 'yearsExperience', question: 'How many years of relevant experience do you have?', required: true },
    { id: 'startDate', question: 'When can you start?', required: false },
    { id: 'salaryExpectation', question: 'What is your expected salary range?', required: false },
  ]

  const handleApply = () => {
    applyJob.mutate(
      {
        id: job._id,
        data: { coverLetter, resume: resumeFile?.name },
      },
      {
        onSuccess: () => {
          setApplicationSubmitted(true)
          setTimeout(() => {
            setApplicationSubmitted(false)
            setShowApplyModal(false)
            setCoverLetter('')
            setResumeFile(null)
            setAdditionalAnswers({})
          }, 2500)
        },
      }
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  if (isLoading) {
    return (
      <motion.div {...pageTransition} className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </motion.div>
    )
  }

  if (isError || !job) {
    return (
      <motion.div {...pageTransition} className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Job not found</h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">This job may have been removed.</p>
        <Button onClick={() => navigate(-1)} className="mt-4" variant="outline">Go Back</Button>
      </motion.div>
    )
  }

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-4xl space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
        <FiArrowLeft size={16} /> Back to jobs
      </button>

      <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-xl bg-[var(--color-bg-tertiary)] flex items-center justify-center shrink-0">
              {job.organization?.logo ? (
                <img src={job.organization.logo} alt="" className="h-16 w-16 rounded-xl object-cover" />
              ) : (
                <span className="text-2xl font-bold text-primary-500">{job.organization?.name?.[0]}</span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{job.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Link to={`/organizations/${job.organization?.slug}`} className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                  {job.organization?.name}
                </Link>
                {job.organization?.isVerified && <span className="text-primary-500 text-sm">✓</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => saveJob.mutate({ id: job._id, isSaved: job.isSaved })} leftIcon={<FiBookmark size={14} fill={job.isSaved ? 'currentColor' : 'none'} />}>
              {job.isSaved ? 'Saved' : 'Save'}
            </Button>
            <Button variant="ghost" size="sm" leftIcon={<FiShare2 size={14} />}>Share</Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--color-text-secondary)]">
          <span className="flex items-center gap-1"><FiMapPin size={14} />{job.location || 'Remote'}</span>
          <span className="flex items-center gap-1"><FiBriefcase size={14} />{job.employmentType?.replace('_', ' ')}</span>
          {job.experienceLevel && <Badge variant="default" size="sm">{job.experienceLevel} level</Badge>}
          {job.isRemote && <Badge variant="success" size="sm">Remote</Badge>}
          {job.salaryMin && job.salaryMax && (
            <span className="flex items-center gap-1">
              <FiDollarSign size={14} />{formatCurrency(job.salaryMin)} - {formatCurrency(job.salaryMax)} / year
            </span>
          )}
          <span className="flex items-center gap-1"><FiClock size={14} />Posted {formatDate(job.createdAt)}</span>
        </div>

        <div className="mt-6">
          {job.hasApplied ? (
            <Button variant="success" disabled leftIcon={<FiCheckCircle size={16} />}>Already Applied</Button>
          ) : (
            <Button onClick={() => setShowApplyModal(true)} leftIcon={<FiUpload size={16} />}>Apply Now</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Description</h2>
            <div className="mt-3 text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">
              {job.description}
            </div>
          </div>

          {job.responsibilities?.length > 0 && (
            <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Responsibilities</h2>
              <ul className="mt-3 space-y-2">
                {job.responsibilities.map((r: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.requirements?.length > 0 && (
            <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Requirements</h2>
              <ul className="mt-3 space-y-2">
                {job.requirements.map((r: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.skills?.map((skill: string) => (
                <Badge key={skill} variant="primary" size="sm">{skill}</Badge>
              ))}
            </div>
          </div>

          {job.benefits?.length > 0 && (
            <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Benefits</h3>
              <ul className="space-y-2">
                {job.benefits.map((b: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <span className="text-accent-500">✓</span> {b}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.applicationDeadline && (
            <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Application Deadline</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">{formatDate(job.applicationDeadline)}</p>
            </div>
          )}

          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">About {job.organization?.name}</h3>
            <p className="text-sm text-[var(--color-text-secondary)] line-clamp-3">{job.organization?.description || 'No description available.'}</p>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">{job.organization?.employeesCount} employees</p>
          </div>

          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Recruiter</h3>
            <div className="flex items-center gap-3">
              <Avatar name={job.recruiter?.fullName || 'Recruiter'} src={job.recruiter?.profilePhoto} size="md" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{job.recruiter?.fullName || 'Hiring Manager'}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{job.recruiter?.headline || 'Recruitment Team'}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{job.organization?.name}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" fullWidth className="mt-4" leftIcon={<FiMessageSquare size={14} />}>Message</Button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Related Jobs</h2>
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <motion.div key={i} variants={staggerItem} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center">
                  <FiBriefcase size={18} className="text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-2/3" />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Application Modal */}
      <Modal isOpen={showApplyModal} onClose={() => { if (!applicationSubmitted) { setShowApplyModal(false); setCoverLetter(''); setResumeFile(null); setAdditionalAnswers({}) } }} size="lg">
        <AnimatePresence mode="wait">
          {applicationSubmitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 rounded-full bg-accent-100 flex items-center justify-center mb-4"
              >
                <FiCheckCircle size={40} className="text-accent-500" />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold text-[var(--color-text-primary)]"
              >
                Application Submitted!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-2 text-sm text-[var(--color-text-secondary)]"
              >
                Your application for <span className="font-medium text-[var(--color-text-primary)]">{job.title}</span> has been submitted successfully.
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-4 flex items-center gap-2 text-sm text-[var(--color-text-muted)]"
              >
                <FiClock size={14} />
                You'll receive updates on your application status
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Apply for {job.title}</h2>
                <button onClick={() => setShowApplyModal(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                  <FiX size={20} />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Resume</label>
                  <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setResumeFile(file)
                  }} />
                  {resumeFile ? (
                    <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] p-3">
                      <div className="rounded-lg bg-primary-100 p-2">
                        <FiFileText size={20} className="text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{resumeFile.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{formatFileSize(resumeFile.size)}</p>
                      </div>
                      <button onClick={() => setResumeFile(null)} className="text-[var(--color-text-muted)] hover:text-danger-500"><FiX size={16} /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => resumeInputRef.current?.click()}
                      className="w-full rounded-lg border-2 border-dashed border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] p-6 flex flex-col items-center gap-2 hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
                    >
                      <FiUpload size={24} className="text-[var(--color-text-muted)]" />
                      <span className="text-sm text-[var(--color-text-secondary)]">Click to upload resume (PDF, DOC, DOCX)</span>
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Cover Letter</label>
                  <Textarea
                    placeholder="Write a cover letter explaining why you're a great fit for this role..."
                    value={coverLetter}
                    onChange={e => setCoverLetter(e.target.value)}
                    rows={5}
                  />
                </div>

                <div className="border-t border-[var(--color-border-primary)] pt-4">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Additional Questions</h3>
                  <div className="space-y-3">
                    {additionalQuestions.map(q => (
                      <div key={q.id}>
                        <label className="block text-sm text-[var(--color-text-secondary)] mb-1">
                          {q.question}
                          {q.required && <span className="text-danger-500 ml-0.5">*</span>}
                        </label>
                        <input
                          type="text"
                          value={additionalAnswers[q.id] || ''}
                          onChange={e => setAdditionalAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          className="w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Your answer..."
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-border-primary)]">
                <Button variant="ghost" onClick={() => setShowApplyModal(false)}>Cancel</Button>
                <Button onClick={handleApply} isLoading={applyJob.isPending} leftIcon={<FiUpload size={16} />}>
                  Submit Application
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>
    </motion.div>
  )
}
