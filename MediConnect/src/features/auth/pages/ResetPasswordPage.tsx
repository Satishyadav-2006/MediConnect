import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { ROUTES } from '@/constants/routes'
import { authService } from '@/api/authService'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/validators'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Logo } from '@/components/ui'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormData>({ resolver: zodResolver(resetPasswordSchema) })

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return
    setIsLoading(true)
    try {
      await authService.resetPassword({ token: token!, new_password: data.password, confirm_password: data.confirmPassword })
      toast.success('Password reset successfully!')
      navigate(ROUTES.LOGIN)
    } catch {
      toast.error('Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-secondary)] px-4">
      <div className="w-full max-w-md text-center">
        <Logo size="lg" className="mx-auto" rounded />
        <h1 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">Reset Password</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
          <Input label="New Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
          <Input label="Confirm Password" type="password" placeholder="••••••••" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
          <Button type="submit" fullWidth isLoading={isLoading}>Reset Password</Button>
        </form>
      </div>
    </div>
  )
}
