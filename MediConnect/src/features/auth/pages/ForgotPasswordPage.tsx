import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { ROUTES } from '@/constants/routes'
import { authService } from '@/api/authService'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/validators'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Logo } from '@/components/ui'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({ resolver: zodResolver(forgotPasswordSchema) })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    try {
      await authService.forgotPassword(data.email)
      setSent(true)
    } catch {
      toast.error('Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-secondary)] px-4">
      <div className="w-full max-w-md text-center">
        <Logo size="lg" className="mx-auto" rounded />
        <h1 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">Forgot Password</h1>
        {sent ? (
          <div className="mt-4 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
            <p className="text-sm text-[var(--color-text-secondary)]">Check your email for a password reset link.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-[var(--color-text-secondary)]">Enter your email to receive a reset link.</p>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
              <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
              <Button type="submit" fullWidth isLoading={isLoading}>Send Reset Link</Button>
            </form>
          </>
        )}
        <Link to={ROUTES.LOGIN} className="mt-4 inline-block text-sm text-primary-500 hover:text-primary-600">Back to login</Link>
      </div>
    </div>
  )
}
