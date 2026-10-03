import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/api/authService'
import { verifyEmailSchema, type VerifyEmailFormData } from '@/validators'
import { getAuthenticatedHomePath } from '@/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Logo } from '@/components/ui'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const { setAuthFromVerify } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(60)
  const [devOtp, setDevOtp] = useState<string | null>(() => (typeof window !== 'undefined' ? localStorage.getItem('verify_otp') : null))
  const { register, setValue, handleSubmit, formState: { errors } } = useForm<VerifyEmailFormData>({ resolver: zodResolver(verifyEmailSchema), defaultValues: { code: devOtp || '' } })

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const resendOtp = async () => {
    setIsResending(true)
    try {
      const email = localStorage.getItem('verify_email') || ''
      const res = await authService.resendVerification(email)
      const result = res.data?.data || res.data
      if (result?.otp) {
        localStorage.setItem('verify_otp', result.otp)
        setDevOtp(result.otp)
        setValue('code', result.otp)
        toast.success('New verification code sent. Use the code shown below.')
      } else {
        localStorage.removeItem('verify_otp')
        setDevOtp(null)
        toast.success('New verification code sent to your email.')
      }
      setResendCooldown(60)
    } catch {
      toast.error('Failed to resend code')
    } finally {
      setIsResending(false)
    }
  }

  const onSubmit = async (data: VerifyEmailFormData) => {
    setIsLoading(true)
    try {
      const res = await authService.verifyEmail({
        email: localStorage.getItem("verify_email")!,
        otp: data.code,
        code: data.code,
      })
      const result = res.data.data || res.data
      localStorage.removeItem('verify_otp')
      if (result.access_token) {
        setAuthFromVerify(result)
        toast.success('Email verified! Welcome aboard.')
        navigate(getAuthenticatedHomePath(String(result.user?.role || '')), { replace: true })
      } else {
        toast.success('Email verified! Please log in.')
        localStorage.removeItem('verify_email')
        navigate(ROUTES.LOGIN, { replace: true })
      }
    } catch {
      toast.error('Invalid verification code')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-secondary)] px-4">
      <div className="w-full max-w-md text-center">
        <Logo size="lg" className="mx-auto" rounded />
        <h1 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">Verify Your Email</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">Enter the 6-digit code sent to your email.</p>
        {devOtp && (
          <p className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-700">
            Email delivery is not configured in this environment. Your code is <strong>{devOtp}</strong>
          </p>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
          <Input label="Verification Code" placeholder="000000" error={errors.code?.message} {...register('code')} />
          <Button type="submit" fullWidth isLoading={isLoading}>Verify</Button>
          <div className="text-center">
            {resendCooldown > 0 ? (
              <button type="button" disabled className="text-sm text-[var(--color-text-muted)]">
                Resend code in {resendCooldown}s
              </button>
            ) : (
              <button type="button" onClick={resendOtp} disabled={isResending} className="text-sm font-medium text-primary-500 hover:text-primary-600">
                {isResending ? 'Sending...' : 'Resend verification code'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
