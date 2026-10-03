import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiUploadCloud, FiCheckCircle, FiFileText, FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import { profileService } from '@/api/profileService'
import Button from '@/components/ui/Button'
import FileUpload from '@/components/ui/FileUpload'

const PROFESSIONS = [
  'doctor', 'nurse', 'dentist', 'pharmacist', 'physiotherapist',
  'radiologist', 'lab_technician', 'medical_student', 'nursing_student',
  'pharmacy_student', 'faculty', 'professor', 'researcher',
  'hospital', 'clinic', 'medical_college',
]

export default function VerificationRequestPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  console.log('VerificationRequestPage rendered, step:', step)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    profession: '',
    registration_number: '',
    medical_council: '',
    country: '',
    state: '',
    hospital: '',
    specialization: '',
  })

  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    setUploadError('')
    setUploading(true)
    const urls: string[] = []
    for (const file of files) {
      try {
        const res = await profileService.uploadVerificationDoc(file)
        const url = res.data.data?.url || res.data.url
        if (url) urls.push(url)
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || `Failed to upload ${file.name}`
        setUploadError(msg)
      }
    }
    setUploadedUrls(prev => [...prev, ...urls])
    setUploading(false)
    return urls
  }

  const handleSubmit = async () => {
    setError('')
    setIsSubmitting(true)
    try {
      await profileService.submitVerification({
        registration_number: form.registration_number,
        issuing_authority: form.medical_council,
        document_urls: uploadedUrls,
        method: 'professional_documents',
      })
      setSubmitted(true)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Submission failed. Please try again.'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-50">
          <FiCheckCircle size={32} className="text-accent-500" />
        </motion.div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Verification Submitted</h2>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          Your documents have been submitted for review. Our team will verify your credentials within 24-48 hours.
        </p>
        <Button className="mt-6" onClick={() => navigate('/verification-status')}>
          Check Verification Status
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
              step === s ? 'bg-primary-500 text-white' :
              step > s ? 'bg-accent-500 text-white' :
              'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'
            }`}>
              {step > s ? <FiCheckCircle size={16} /> : s}
            </div>
            {s < 3 && <div className={`h-0.5 w-12 ${step > s ? 'bg-accent-500' : 'bg-[var(--color-bg-tertiary)]'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Professional Information</h1>
          <p className="text-[var(--color-text-secondary)]">Provide your professional details for verification.</p>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Profession</label>
            <select value={form.profession} onChange={e => updateField('profession', e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3 py-2.5 text-sm">
              <option value="">Select your profession</option>
              {PROFESSIONS.map(p => <option key={p} value={p}>{p.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Registration / License Number</label>
              <input value={form.registration_number} onChange={e => updateField('registration_number', e.target.value)}
                placeholder="e.g. MMC-2024-12345"
                className="w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Medical / Professional Council</label>
              <input value={form.medical_council} onChange={e => updateField('medical_council', e.target.value)}
                placeholder="e.g. Maharashtra Medical Council"
                className="w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3 py-2.5 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Country</label>
              <input value={form.country} onChange={e => updateField('country', e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">State</label>
              <input value={form.state} onChange={e => updateField('state', e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3 py-2.5 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Specialization</label>
              <input value={form.specialization} onChange={e => updateField('specialization', e.target.value)}
                placeholder="e.g. Cardiologist"
                className="w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Hospital / Clinic (optional)</label>
              <input value={form.hospital} onChange={e => updateField('hospital', e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3 py-2.5 text-sm" />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setStep(2)} rightIcon={<FiArrowRight size={16} />}>
              Next - Upload Documents
            </Button>
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Upload Supporting Documents</h1>
          <p className="text-[var(--color-text-secondary)]">Upload at least one official document for verification.</p>

          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
            <h3 className="font-semibold text-[var(--color-text-primary)]">Accepted Documents</h3>
            <ul className="mt-2 space-y-1 text-sm text-[var(--color-text-secondary)]">
              <li className="flex items-center gap-2"><FiFileText size={14} /> Medical License</li>
              <li className="flex items-center gap-2"><FiFileText size={14} /> Medical Council Registration Certificate</li>
              <li className="flex items-center gap-2"><FiFileText size={14} /> Nursing / Pharmacy Council Registration</li>
              <li className="flex items-center gap-2"><FiFileText size={14} /> Hospital Employee ID</li>
              <li className="flex items-center gap-2"><FiFileText size={14} /> Internship Certificate</li>
              <li className="flex items-center gap-2"><FiFileText size={14} /> Student ID + College ID (for students)</li>
            </ul>
          </div>

          <FileUpload
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            label="Upload Verification Documents"
            onFiles={async (files) => {
              await uploadFiles(files)
            }}
          />

          {uploadError && <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger-600">{uploadError}</div>}

          {uploadedUrls.length > 0 && (
            <div className="rounded-lg bg-accent-50 p-3 text-sm text-accent-700">
              {uploadedUrls.length} document(s) uploaded successfully
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={() => setStep(1)} leftIcon={<FiArrowLeft size={16} />}>
              Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={uploading}
              rightIcon={<FiArrowRight size={16} />}
            >
              Next - Review & Submit
            </Button>
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Review & Submit</h1>
          <p className="text-[var(--color-text-secondary)]">Please review your information before submitting.</p>

          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-[var(--color-text-muted)]">Profession:</span> <span className="font-medium">{form.profession.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</span></div>
              <div><span className="text-[var(--color-text-muted)]">Registration No:</span> <span className="font-medium">{form.registration_number}</span></div>
              <div><span className="text-[var(--color-text-muted)]">Council:</span> <span className="font-medium">{form.medical_council}</span></div>
              <div><span className="text-[var(--color-text-muted)]">Specialization:</span> <span className="font-medium">{form.specialization}</span></div>
              <div><span className="text-[var(--color-text-muted)]">Country:</span> <span className="font-medium">{form.country}</span></div>
              <div><span className="text-[var(--color-text-muted)]">State:</span> <span className="font-medium">{form.state}</span></div>
              {form.hospital && <div className="col-span-2"><span className="text-[var(--color-text-muted)]">Hospital/Clinic:</span> <span className="font-medium">{form.hospital}</span></div>}
            </div>
            <div className="pt-2 border-t border-[var(--color-border-primary)]">
              <span className="text-sm text-[var(--color-text-muted)]">Documents uploaded:</span>
              <span className="ml-2 text-sm font-medium">{uploadedUrls.length} file(s)</span>
            </div>
          </div>

          {error && <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger-600">{error}</div>}

          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={() => setStep(2)} leftIcon={<FiArrowLeft size={16} />}>
              Back
            </Button>
            <Button onClick={handleSubmit} isLoading={isSubmitting}>
              Submit Verification Request
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
