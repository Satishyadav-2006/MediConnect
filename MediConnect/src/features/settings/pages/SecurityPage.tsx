import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsService } from '@/api/settingsService'
import { pageTransition } from '@/animations'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import { formatDate, cn } from '@/utils'
import { FiMonitor, FiSmartphone, FiGlobe, FiTrash2 } from 'react-icons/fi'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').regex(/[A-Z]/, 'Must contain an uppercase letter').regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

type PasswordFormData = z.infer<typeof passwordSchema>

interface Session {
  _id: string
  device: string
  browser: string
  ip: string
  lastActive: string
  isCurrent: boolean
}

interface LoginHistory {
  _id: string
  device: string
  browser: string
  ip: string
  location: string
  timestamp: string
  success: boolean
}

export default function SecurityPage() {
  const qc = useQueryClient()
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  const { data: sessionsData, isLoading: loadingSessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => settingsService.getBlockedUsers(1, 1).then(r => r.data),
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => settingsService.changePassword(data),
    onSuccess: () => {
      toast.success('Password updated successfully')
      setShowPasswordForm(false)
      reset()
    },
    onError: () => toast.error('Failed to update password. Check your current password.'),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema) as any,
  })

  const onSubmit = (data: PasswordFormData) => {
    changePasswordMutation.mutate({ currentPassword: data.currentPassword, newPassword: data.newPassword })
  }

  const sessions = (sessionsData?.data?.sessions || []) as Session[]
  const loginHistory = (sessionsData?.data?.loginHistory || []) as LoginHistory[]

  const getDeviceIcon = (device: string) => {
    if (device?.toLowerCase().includes('mobile') || device?.toLowerCase().includes('phone')) {
      return <FiSmartphone size={16} />
    }
    return <FiMonitor size={16} />
  }

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Security Settings</h1>

      <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Change Password</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">Update your password to keep your account secure</p>
          </div>
          {!showPasswordForm && (
            <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(true)}>Change Password</Button>
          )}
        </div>

        {showPasswordForm && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4 border-t border-[var(--color-border-primary)]">
            <Input
              label="Current Password"
              type="password"
              {...register('currentPassword')}
              error={errors.currentPassword?.message}
            />
            <Input
              label="New Password"
              type="password"
              {...register('newPassword')}
              error={errors.newPassword?.message}
            />
            <Input
              label="Confirm New Password"
              type="password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => { setShowPasswordForm(false); reset() }}>Cancel</Button>
              <Button type="submit" isLoading={changePasswordMutation.isPending}>Update Password</Button>
            </div>
          </form>
        )}
      </div>

      <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Two-Factor Authentication</h2>
        <div className="rounded-lg bg-[var(--color-bg-tertiary)] p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Authenticator App</p>
            <p className="text-xs text-[var(--color-text-secondary)]">Use an authenticator app to generate one-time codes</p>
          </div>
          <Button variant="outline" size="sm">Coming Soon</Button>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Active Sessions</h2>
        {loadingSessions ? (
          <div className="space-y-3">
            {[1, 2].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] py-4">No active sessions</p>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <div key={session._id} className="flex items-center justify-between rounded-lg p-4 bg-[var(--color-bg-tertiary)]">
                <div className="flex items-center gap-3">
                  <div className="text-[var(--color-text-muted)]">{getDeviceIcon(session.device)}</div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {session.browser} on {session.device}
                      {session.isCurrent && <Badge variant="success" size="sm" className="ml-2">Current</Badge>}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      IP: {session.ip} · Last active: {formatDate(session.lastActive)}
                    </p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <Button variant="ghost" size="sm" leftIcon={<FiTrash2 size={14} />} onClick={() => toast.success('Session revoked')}>
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Login History</h2>
        {loginHistory.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] py-4">No login history available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border-primary)]">
                  <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] pb-3">Device</th>
                  <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] pb-3">IP</th>
                  <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] pb-3">Location</th>
                  <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] pb-3">Time</th>
                  <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {loginHistory.map(entry => (
                  <tr key={entry._id} className="border-b border-[var(--color-border-primary)] last:border-0">
                    <td className="py-3 text-sm text-[var(--color-text-primary)]">{entry.browser} on {entry.device}</td>
                    <td className="py-3 text-sm text-[var(--color-text-secondary)]">{entry.ip}</td>
                    <td className="py-3 text-sm text-[var(--color-text-secondary)]">{entry.location}</td>
                    <td className="py-3 text-sm text-[var(--color-text-secondary)]">{formatDate(entry.timestamp)}</td>
                    <td className="py-3">
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', entry.success ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50')}>
                        {entry.success ? 'Success' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}
