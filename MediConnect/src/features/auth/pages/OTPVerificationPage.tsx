import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { FiCheckCircle } from 'react-icons/fi'
import { ROUTES } from '@/constants/routes'
import { authService } from '@/api/authService'
import { verifyEmailSchema, type VerifyEmailFormData } from '@/validators'
import { pageTransition } from '@/animations'
import Button from '@/components/ui/Button'
import { Logo } from '@/components/ui'

export default function OTPVerificationPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState('')
  const [isExpired, setIsExpired] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const { handleSubmit, setValue, formState: { errors } } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { code: '' },
  })

  useEffect(() => {
    if (resendCooldown <= 0) {
      setCanResend(true)
      return
    }
    setCanResend(false)
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setOtpError('')
    setIsExpired(false)
    const code = newOtp.join('')
    setValue('code', code, { shouldValidate: code.length === 6 })

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) {
      const newOtp = pasted.split('').concat(Array(6).fill('')).slice(0, 6)
      setOtp(newOtp)
      setValue('code', pasted, { shouldValidate: pasted.length === 6 })
      const focusIndex = Math.min(pasted.length, 5)
      inputRefs.current[focusIndex]?.focus()
    }
  }

  const resendOtp = useCallback(async () => {
    try {
      await authService.resendVerification(localStorage.getItem('verify_email') || '')
      toast.success('New verification code sent to your email')
      setResendCooldown(60)
      setCanResend(false)
      setIsExpired(false)
    } catch {
      toast.error('Failed to resend code')
    }
  }, [])

  const onSubmit = async (_data: VerifyEmailFormData) => {
    const code = otp.join('')
    if (code.length !== 6) {
      setOtpError('Please enter the complete 6-digit code')
      return
    }
    setIsLoading(true)
    try {
      await authService.verifyEmail({ code })
      setIsSuccess(true)
      toast.success('Email verified successfully!')
      setTimeout(() => navigate(ROUTES.PENDING_VERIFICATION), 1500)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      const msg = error.response?.data?.message || 'Invalid or expired code'
      setOtpError(msg)
      toast.error(msg)
      if (msg.toLowerCase().includes('expired')) {
        setIsExpired(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-secondary)] px-4">
      <motion.div className="w-full max-w-md text-center" {...pageTransition}>
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-8 shadow-sm"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent-50"
              >
                <FiCheckCircle size={40} className="text-accent-500" />
              </motion.div>
              <h2 className="mt-6 text-2xl font-bold text-[var(--color-text-primary)]">Verification Successful</h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Your email has been verified. Redirecting to your account...
              </p>
            </motion.div>
          ) : (
            <motion.div key="form">
              <Logo size="lg" className="mx-auto" rounded />
              <h1 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">Verify Your Email</h1>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Enter the 6-digit verification code sent to your email address.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 shadow-sm">
                <div className="flex justify-center gap-3">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { inputRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleChange(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      onPaste={i === 0 ? handlePaste : undefined}
                      className={`h-14 w-12 rounded-lg border bg-[var(--color-bg-primary)] text-center text-xl font-semibold text-[var(--color-text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        otpError ? 'border-danger-500' : 'border-[var(--color-border-primary)]'
                      }`}
                    />
                  ))}
                </div>

                {(otpError || errors.code?.message) && (
                  <p className="mt-3 text-sm text-danger-500">{otpError || errors.code?.message}</p>
                )}

                {isExpired && (
                  <p className="mt-2 text-sm text-warning-600">
                    Your code has expired. Please request a new one.
                  </p>
                )}

                <div className="mt-6">
                  <Button type="submit" fullWidth isLoading={isLoading} disabled={otp.join('').length !== 6}>
                    Verify Email
                  </Button>
                </div>

                <div className="mt-4 text-center">
                  {canResend ? (
                    <button type="button" onClick={resendOtp} className="text-sm font-medium text-primary-500 hover:text-primary-600">
                      Resend verification code
                    </button>
                  ) : (
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Resend code in {resendCooldown}s
                    </p>
                  )}
                </div>
              </form>

              <p className="mt-4 text-center text-sm text-[var(--color-text-secondary)]">
                <Link to={ROUTES.LOGIN} className="font-medium text-primary-500 hover:text-primary-600">
                  Back to login
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
