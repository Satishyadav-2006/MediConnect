import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/contexts/AuthContext'
import { loginSchema, type LoginFormData } from '@/validators'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Logo } from '@/components/ui'
import { getAuthenticatedHomePath } from '@/utils'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const authenticatedUser = await login(data.email, data.password, !!data.rememberMe)
      toast.success('Welcome back!')
      navigate(getAuthenticatedHomePath(authenticatedUser.role))
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-secondary)] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo size="lg" className="mx-auto" rounded />
          <h1 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">Welcome back</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Log in to your MediConnect account</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 shadow-sm">
          <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
          <Input label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded border-[var(--color-border-primary)] text-primary-500 focus:ring-primary-500" {...register('rememberMe')} />
              <span className="text-sm text-[var(--color-text-secondary)]">Remember Me</span>
            </label>
            <Link to={ROUTES.FORGOT_PASSWORD} className="text-sm text-primary-500 hover:text-primary-600">Forgot password?</Link>
          </div>
          <Button type="submit" fullWidth isLoading={isLoading}>Log in</Button>
        </form>
        <p className="mt-4 text-center text-sm text-[var(--color-text-secondary)]">
          Don't have an account? <Link to={ROUTES.REGISTER} className="font-medium text-primary-500 hover:text-primary-600">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
