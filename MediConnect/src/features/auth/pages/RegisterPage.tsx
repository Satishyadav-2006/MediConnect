import { useState, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  FiUsers, FiActivity, FiPackage, FiHome,
  FiArrowRight, FiArrowLeft, FiCheck, FiCheckCircle, FiX,
  FiDroplet, FiRadio, FiStar, FiBookOpen, FiAward, FiGrid, FiLink2, FiTrendingUp
} from 'react-icons/fi'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/contexts/AuthContext'
import { pageTransition } from '@/animations'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Logo } from '@/components/ui'
import { cn } from '@/utils'

const roleGroups = [
  {
    label: 'Healthcare Professionals',
    roles: [
      { value: 'doctor', label: 'Doctor', icon: FiActivity, desc: 'Medical practitioner' },
      { value: 'nurse', label: 'Nurse', icon: FiActivity, desc: 'Nursing professional' },
      { value: 'dentist', label: 'Dentist', icon: FiDroplet, desc: 'Dental professional' },
      { value: 'pharmacist', label: 'Pharmacist', icon: FiPackage, desc: 'Pharmacy professional' },
      { value: 'physiotherapist', label: 'Physiotherapist', icon: FiTrendingUp, desc: 'Physical therapy' },
      { value: 'lab_technician', label: 'Lab Technician', icon: FiRadio, desc: 'Laboratory professional' },
      { value: 'radiologist', label: 'Radiologist', icon: FiRadio, desc: 'Radiology specialist' },
      { value: 'allied_health', label: 'Allied Health', icon: FiStar, desc: 'Allied health services' },
    ],
  },
  {
    label: 'Students',
    roles: [
      { value: 'medical_student', label: 'Medical Student', icon: FiBookOpen, desc: 'Medicine student' },
      { value: 'nursing_student', label: 'Nursing Student', icon: FiBookOpen, desc: 'Nursing student' },
      { value: 'pharmacy_student', label: 'Pharmacy Student', icon: FiBookOpen, desc: 'Pharmacy student' },
      { value: 'physiotherapy_student', label: 'Physiotherapy Student', icon: FiBookOpen, desc: 'Physiotherapy student' },
    ],
  },
  {
    label: 'Organizations',
    roles: [
      { value: 'hospital', label: 'Hospital', icon: FiHome, desc: 'Healthcare facility' },
      { value: 'clinic', label: 'Clinic', icon: FiUsers, desc: 'Medical clinic' },
      { value: 'medical_college', label: 'Medical College', icon: FiGrid, desc: 'Medical education' },
      { value: 'nursing_college', label: 'Nursing College', icon: FiGrid, desc: 'Nursing education' },
      { value: 'pharmacy_college', label: 'Pharmacy College', icon: FiGrid, desc: 'Pharmacy education' },
      { value: 'allied_health_college', label: 'Allied Health College', icon: FiGrid, desc: 'Allied health education' },
    ],
  },
  {
    label: 'Recruitment',
    roles: [
      { value: 'faculty', label: 'Faculty', icon: FiAward, desc: 'Academic faculty' },
      { value: 'professor', label: 'Professor', icon: FiAward, desc: 'Professor' },
      { value: 'hr', label: 'HR', icon: FiUsers, desc: 'Human resources' },
      { value: 'recruiter', label: 'Recruiter', icon: FiLink2, desc: 'Healthcare recruiter' },
      { value: 'placement_officer', label: 'Placement Officer', icon: FiLink2, desc: 'Placement services' },
    ],
  },
]

type RoleValue = string

const step1Schema = z.object({ role: z.string().min(1, 'Please select a role') })
const step2Schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required').min(10, 'Phone number must be at least 10 digits'),
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State is required'),
  city: z.string().min(1, 'City is required'),
})
const step3Schema = z.object({
  specialization: z.string().min(1, 'Specialization is required'),
  yearsOfExperience: z.number().min(0, 'Must be at least 0').max(60),
  currentOrganization: z.string().optional(),
})
const step4Schema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^a-zA-Z0-9]/, 'Must contain a special character'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })
const step5Schema = z.object({
  acceptTerms: z.literal(true).refine(val => val === true, { message: 'You must accept the terms' }),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>
type Step3Data = z.infer<typeof step3Schema>
type Step4Data = z.infer<typeof step4Schema>
type Step5Data = z.infer<typeof step5Schema>

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  if (password.length >= 12) score++

  if (score <= 1) return { score, label: 'Weak', color: 'bg-danger-500' }
  if (score <= 2) return { score, label: 'Fair', color: 'bg-warning-500' }
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-400' }
  return { score, label: 'Strong', color: 'bg-accent-500' }
}

const SPECIALIZATIONS = [
  'Cardiology', 'Dermatology', 'Emergency Medicine', 'Endocrinology',
  'Family Medicine', 'Gastroenterology', 'General Surgery', 'Geriatrics',
  'Hematology', 'Infectious Disease', 'Internal Medicine', 'Nephrology',
  'Neurology', 'Neurosurgery', 'Obstetrics & Gynecology', 'Oncology',
  'Ophthalmology', 'Orthopedics', 'Otolaryngology', 'Pathology',
  'Pediatrics', 'Physical Medicine', 'Plastic Surgery', 'Psychiatry',
  'Pulmonology', 'Radiology', 'Rheumatology', 'Urology',
]

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const usernameTimer = useRef<ReturnType<typeof setTimeout>>(null)

  const [formData, setFormData] = useState({
    role: '' as RoleValue,
    fullName: '',
    email: '',
    phone: '',
    country: '',
    state: '',
    city: '',
    specialization: '',
    yearsOfExperience: 0,
    currentOrganization: '',
    username: '',
    password: '',
  })

  const step1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema), defaultValues: { role: formData.role } })
  const step2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema), defaultValues: { fullName: formData.fullName, email: formData.email, phone: formData.phone, country: formData.country, state: formData.state, city: formData.city } })
  const step3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema), defaultValues: { specialization: formData.specialization, yearsOfExperience: formData.yearsOfExperience, currentOrganization: formData.currentOrganization } })
  const step4 = useForm<Step4Data>({ resolver: zodResolver(step4Schema), defaultValues: { username: formData.username, password: '', confirmPassword: '' } })
  const step5 = useForm<Step5Data>({ resolver: zodResolver(step5Schema), defaultValues: { acceptTerms: false as unknown as true } })

  const steps = ['Choose Role', 'Personal Info', 'Professional Info', 'Account Details', 'Review & Submit']
  const isOrg = ['hospital', 'clinic', 'medical_college', 'nursing_college', 'pharmacy_college', 'allied_health_college'].includes(formData.role)

  const checkUsername = useCallback((username: string) => {
    if (usernameTimer.current) clearTimeout(usernameTimer.current)
    if (username.length < 3) { setUsernameStatus('idle'); return }
    setUsernameStatus('checking')
    usernameTimer.current = setTimeout(() => {
      const taken = ['admin', 'doctor', 'nurse', 'test', 'user'].includes(username.toLowerCase())
      setUsernameStatus(taken ? 'taken' : 'available')
    }, 500)
  }, [])

  const goNext = async () => {
    let valid = false
    let data: Record<string, unknown> = {}

    switch (currentStep) {
      case 0:
        valid = await step1.trigger()
        data = step1.getValues()
        break
      case 1:
        valid = await step2.trigger()
        data = step2.getValues()
        break
      case 2:
        if (isOrg) {
          valid = true
        } else {
          valid = await step3.trigger()
          data = step3.getValues()
        }
        break
      case 3:
        valid = await step4.trigger()
        data = step4.getValues()
        break
      case 4:
        valid = await step5.trigger()
        break
    }

    if (valid) {
      setFormData(prev => ({ ...prev, ...data }))
      setDirection(1)
      setCurrentStep(s => s + 1)
    }
  }

  const goBack = () => {
    setDirection(-1)
    setCurrentStep(s => s - 1)
  }

  const onSubmit = async () => {
    setIsLoading(true)
    try {
      const step4Values = step4.getValues()
      const nameParts = formData.fullName.trim().split(/\s+/)
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      await registerUser({
        role: formData.role,
        first_name: firstName,
        last_name: lastName,
        email: formData.email,
        username: step4Values.username,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        password: step4Values.password,
        confirm_password: step4Values.confirmPassword,
        phone: formData.phone || undefined,
        specialization: !isOrg ? formData.specialization : undefined,
        experience_years: !isOrg ? formData.yearsOfExperience : undefined,
        organization_name: isOrg ? formData.fullName : undefined,
      })
      toast.success('Account created! Please verify your email.')
      navigate(ROUTES.VERIFY_EMAIL)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const password = step4.watch('password') || ''
  const strength = getPasswordStrength(password)

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-secondary)] px-4 py-8">
      <motion.div className="w-full max-w-lg" {...pageTransition}>
        <div className="mb-6 text-center">
          <Logo size="lg" className="mx-auto" rounded />
          <h1 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">Create your account</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Join the healthcare community</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  i < currentStep ? 'bg-accent-500 text-white' :
                  i === currentStep ? 'bg-primary-500 text-white' :
                  'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'
                )}>
                  {i < currentStep ? <FiCheck size={14} /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={cn('h-0.5 w-6 sm:w-10 mx-1', i < currentStep ? 'bg-accent-500' : 'bg-[var(--color-bg-tertiary)]')} />
                )}
              </div>
            ))}
          </div>
          <div className="h-1.5 w-full rounded-full bg-[var(--color-bg-tertiary)]">
            <div
              className="h-full rounded-full bg-primary-500 transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-[var(--color-text-muted)] text-center">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 shadow-sm overflow-hidden min-h-[360px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              {currentStep === 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Select your role</h2>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4">Choose the role that best describes you</p>
                  <div className="max-h-[400px] overflow-y-auto space-y-4 pr-1">
                    {roleGroups.map(group => (
                      <div key={group.label}>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">{group.label}</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {group.roles.map(r => {
                            const Icon = r.icon
                            return (
                              <button
                                key={r.value}
                                type="button"
                                onClick={() => {
                                  step1.setValue('role', r.value, { shouldValidate: true })
                                  setFormData(prev => ({ ...prev, role: r.value }))
                                }}
                                className={cn(
                                  'flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all text-center',
                                  formData.role === r.value
                                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                                    : 'border-[var(--color-border-primary)] hover:border-primary-300 hover:bg-[var(--color-bg-hover)]'
                                )}
                              >
                                <Icon size={20} />
                                <span className="text-xs font-medium">{r.label}</span>
                                <span className="text-[10px] text-[var(--color-text-muted)] leading-tight">{r.desc}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  {step1.formState.errors.role?.message && (
                    <p className="mt-2 text-sm text-danger-500 text-center">{step1.formState.errors.role.message}</p>
                  )}
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Personal Information</h2>
                  <Input label="Full Name" placeholder={isOrg ? 'Organization Name' : 'Dr. John Smith'} error={step2.formState.errors.fullName?.message} {...step2.register('fullName', { onChange: e => setFormData(p => ({ ...p, fullName: e.target.value })) })} />
                  <Input label="Email" type="email" placeholder="you@example.com" error={step2.formState.errors.email?.message} {...step2.register('email', { onChange: e => setFormData(p => ({ ...p, email: e.target.value })) })} />
                  <Input label="Phone Number" type="tel" placeholder="+1 (555) 123-4567" error={step2.formState.errors.phone?.message} {...step2.register('phone', { onChange: e => setFormData(p => ({ ...p, phone: e.target.value })) })} />
                  <Input label="Country" placeholder="Country" error={step2.formState.errors.country?.message} {...step2.register('country', { onChange: e => setFormData(p => ({ ...p, country: e.target.value })) })} />
                  <Input label="State" placeholder="State" error={step2.formState.errors.state?.message} {...step2.register('state', { onChange: e => setFormData(p => ({ ...p, state: e.target.value })) })} />
                  <Input label="City" placeholder="City" error={step2.formState.errors.city?.message} {...step2.register('city', { onChange: e => setFormData(p => ({ ...p, city: e.target.value })) })} />
                </div>
              )}

              {currentStep === 2 && !isOrg && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Professional Information</h2>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Specialization</label>
                    <select
                      className="w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={step3.watch('specialization')}
                      onChange={e => { step3.setValue('specialization', e.target.value); setFormData(p => ({ ...p, specialization: e.target.value })) }}
                    >
                      <option value="">Select specialization</option>
                      {SPECIALIZATIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {step3.formState.errors.specialization?.message && (
                      <p className="mt-1 text-sm text-danger-500">{step3.formState.errors.specialization.message}</p>
                    )}
                  </div>
                  <Input label="Years of Experience" type="number" placeholder="0" error={step3.formState.errors.yearsOfExperience?.message} {...step3.register('yearsOfExperience', { valueAsNumber: true, onChange: e => setFormData(p => ({ ...p, yearsOfExperience: Number(e.target.value) })) })} />
                  <Input label="Current Organization (Optional)" placeholder="City Hospital" error={step3.formState.errors.currentOrganization?.message} {...step3.register('currentOrganization', { onChange: e => setFormData(p => ({ ...p, currentOrganization: e.target.value })) })} />
                </div>
              )}

              {currentStep === 2 && isOrg && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Organization Details</h2>
                  <Input label="Organization Type" value={formData.role.charAt(0).toUpperCase() + formData.role.slice(1).replace(/_/g, ' ')} disabled />
                  <Input label="Organization Name" value={formData.fullName} disabled />
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    You can complete your organization profile after registration.
                  </p>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Account Details</h2>
                  <div>
                    <Input
                      label="Username"
                      placeholder="johndoe"
                      error={step4.formState.errors.username?.message || (usernameStatus === 'taken' ? 'Username is already taken' : undefined)}
                      {...step4.register('username', { onChange: e => { setFormData(p => ({ ...p, username: e.target.value })); checkUsername(e.target.value) } })}
                    />
                    {usernameStatus === 'checking' && <p className="mt-1 text-xs text-[var(--color-text-muted)]">Checking availability...</p>}
                    {usernameStatus === 'available' && <p className="mt-1 text-xs text-accent-500 flex items-center gap-1"><FiCheckCircle size={12} /> Username is available</p>}
                    {usernameStatus === 'taken' && <p className="mt-1 text-xs text-danger-500 flex items-center gap-1"><FiX size={12} /> Username is already taken</p>}
                  </div>
                  <div>
                    <Input
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      error={step4.formState.errors.password?.message}
                      {...step4.register('password')}
                    />
                    {password && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[var(--color-text-muted)]">Password strength</span>
                          <span className={cn('text-xs font-medium', strength.score <= 1 ? 'text-danger-500' : strength.score <= 2 ? 'text-warning-500' : strength.score <= 3 ? 'text-yellow-500' : 'text-accent-500')}>
                            {strength.label}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[var(--color-bg-tertiary)]">
                          <div className={cn('h-full rounded-full transition-all duration-300', strength.color)} style={{ width: `${(strength.score / 5) * 100}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="••••••••"
                    error={step4.formState.errors.confirmPassword?.message}
                    {...step4.register('confirmPassword')}
                  />
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Review & Submit</h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">Please review your information before submitting.</p>
                  <div className="rounded-lg bg-[var(--color-bg-secondary)] p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--color-text-muted)]">Role</span>
                      <span className="text-sm font-medium text-[var(--color-text-primary)] capitalize">{formData.role.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--color-text-muted)]">Name</span>
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">{formData.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--color-text-muted)]">Email</span>
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">{formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--color-text-muted)]">Phone</span>
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">{formData.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--color-text-muted)]">Location</span>
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">{formData.city}, {formData.state}, {formData.country}</span>
                    </div>
                    {!isOrg && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-[var(--color-text-muted)]">Specialization</span>
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">{formData.specialization}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-[var(--color-text-muted)]">Experience</span>
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">{formData.yearsOfExperience} years</span>
                        </div>
                        {formData.currentOrganization && (
                          <div className="flex justify-between">
                            <span className="text-sm text-[var(--color-text-muted)]">Organization</span>
                            <span className="text-sm font-medium text-[var(--color-text-primary)]">{formData.currentOrganization}</span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--color-text-muted)]">Username</span>
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">@{formData.username}</span>
                    </div>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-[var(--color-border-primary)] text-primary-500 focus:ring-primary-500"
                      {...step5.register('acceptTerms')}
                    />
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      I agree to the{' '}
                      <Link to={ROUTES.TERMS} className="text-primary-500 hover:text-primary-600">Terms and Conditions</Link>
                      {' '}and{' '}
                      <Link to={ROUTES.PRIVACY_POLICY} className="text-primary-500 hover:text-primary-600">Privacy Policy</Link>
                    </span>
                  </label>
                  {step5.formState.errors.acceptTerms?.message && (
                    <p className="text-sm text-danger-500">{step5.formState.errors.acceptTerms.message}</p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-4 flex items-center gap-3">
          {currentStep > 0 && (
            <Button variant="outline" onClick={goBack} leftIcon={<FiArrowLeft size={16} />}>
              Back
            </Button>
          )}
          {currentStep < 4 ? (
            <Button fullWidth onClick={goNext} rightIcon={<FiArrowRight size={16} />}>
              Next
            </Button>
          ) : (
            <Button fullWidth isLoading={isLoading} onClick={onSubmit} rightIcon={<FiCheck size={16} />}>
              Create Account
            </Button>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-[var(--color-text-secondary)]">
          Already have an account? <Link to={ROUTES.LOGIN} className="font-medium text-primary-500 hover:text-primary-600">Log in</Link>
        </p>
      </motion.div>
    </div>
  )
}
