import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiSave, FiUser, FiShield, FiEye, FiBell, FiLock, FiSun, FiUserX, FiMail, FiAlertTriangle, FiGlobe } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useI18n } from '@/config/i18n'
import { useUpdateProfile } from '@/features/profile/hooks/useProfile'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { settingsService } from '@/api/settingsService'
import { extractList } from '@/lib/pagination'
import { pageTransition } from '@/animations'
import { Tabs, TabList, TabTrigger, TabContent } from '@/components/ui/Tabs'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import Avatar from '@/components/ui/Avatar'
import { showSuccess, showError } from '@/components/ui/Toast'
import { cn } from '@/utils'

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const { t, locale, setLocale } = useI18n()
  const updateProfile = useUpdateProfile()
  const qc = useQueryClient()
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [headline, setHeadline] = useState(user?.headline || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [deactivatePassword, setDeactivatePassword] = useState('')
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)

  const { data: notifSettings } = useQuery({
    queryKey: ['notificationSettings'],
    queryFn: () => settingsService.getNotificationSettings().then(r => r.data),
  })

  const { data: privacySettings } = useQuery({
    queryKey: ['privacySettings'],
    queryFn: () => settingsService.getPrivacySettings().then(r => r.data),
  })

  const updateNotifMutation = useMutation({
    mutationFn: (settings: Record<string, boolean>) => settingsService.updateNotificationSettings(settings),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificationSettings'] }),
  })

  const updatePrivacyMutation = useMutation({
    mutationFn: (settings: Record<string, unknown>) => settingsService.updatePrivacySettings(settings),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['privacySettings'] }),
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => settingsService.changePassword(data),
  })

  const updateEmailMutation = useMutation({
    mutationFn: (data: { newEmail: string; password: string }) => settingsService.updateEmail(data),
    onSuccess: () => { showSuccess('Email updated. Please verify your new email.'); setNewEmail(''); setEmailPassword('') },
    onError: () => showError('Failed to update email'),
  })

  const deactivateMutation = useMutation({
    mutationFn: (password: string) => settingsService.deactivateAccount(password),
    onSuccess: () => { showSuccess('Account deactivated'); window.location.href = '/login' },
    onError: () => showError('Failed to deactivate account'),
  })

  const { data: blockedData, isLoading: isBlockedLoading } = useQuery({
    queryKey: ['blockedUsers'],
    queryFn: () => settingsService.getBlockedUsers(1, 100).then(r => r.data),
  })

  const unblockMutation = useMutation({
    mutationFn: (userId: string) => settingsService.unblockUser(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blockedUsers'] }),
  })

  const notifs = notifSettings?.data || notifSettings || {}
  const privacy = privacySettings?.data || privacySettings || {}
  const blockedUsers = extractList<{ _id: string; user: { _id: string; fullName: string; profilePhoto?: string; headline?: string }; blockedAt: string }>(blockedData)

  const handleSaveProfile = () => {
    const nameParts = (fullName || '').trim().split(' ')
    updateProfile.mutate({
      first_name: nameParts[0] || undefined,
      last_name: nameParts.slice(1).join(' ') || undefined,
      headline: headline || undefined,
      bio: bio || undefined,
    })
  }

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword || !currentPassword) return
    changePasswordMutation.mutate(
      { currentPassword, newPassword },
      { onSuccess: () => { setCurrentPassword(''); setNewPassword(''); setConfirmPassword('') } }
    )
  }

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Settings</h1>

      <Tabs defaultValue="profile">
        <TabList>
          <TabTrigger value="profile"><FiUser size={14} className="mr-1.5" /> Profile</TabTrigger>
          <TabTrigger value="account"><FiShield size={14} className="mr-1.5" /> Account</TabTrigger>
          <TabTrigger value="privacy"><FiEye size={14} className="mr-1.5" /> Privacy</TabTrigger>
          <TabTrigger value="notifications"><FiBell size={14} className="mr-1.5" /> Notifications</TabTrigger>
          <TabTrigger value="security"><FiLock size={14} className="mr-1.5" /> Security</TabTrigger>
          <TabTrigger value="blocked"><FiUserX size={14} className="mr-1.5" /> Blocked Users</TabTrigger>
          <TabTrigger value="appearance"><FiSun size={14} className="mr-1.5" /> Appearance</TabTrigger>
          <TabTrigger value="language"><FiGlobe size={14} className="mr-1.5" /> {t.settings.language}</TabTrigger>
        </TabList>

        <TabContent value="profile">
          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Profile Information</h2>
            <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} />
            <Input label="Headline" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="e.g. Cardiologist at Mayo Clinic" />
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} isLoading={updateProfile.isPending} leftIcon={<FiSave size={14} />}>Save</Button>
            </div>
          </div>
        </TabContent>

        <TabContent value="security">
          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Change Password</h2>
            <Input label="Current Password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            <Input label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} error={newPassword !== confirmPassword && confirmPassword ? 'Passwords do not match' : undefined} />
            <div className="flex justify-end">
              <Button onClick={handleChangePassword} isLoading={changePasswordMutation.isPending} disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}>Update Password</Button>
            </div>
          </div>
        </TabContent>

        <TabContent value="notifications">
          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Notification Preferences</h2>
            {[
              { key: 'emailNotifications', label: 'Email Notifications' },
              { key: 'pushNotifications', label: 'Push Notifications' },
              { key: 'connectionRequests', label: 'Connection Requests' },
              { key: 'messages', label: 'Messages' },
              { key: 'jobAlerts', label: 'Job Alerts' },
              { key: 'eventReminders', label: 'Event Reminders' },
              { key: 'mentorshipUpdates', label: 'Mentorship Updates' },
              { key: 'systemUpdates', label: 'System Updates' },
            ].map(item => (
              <label key={item.key} className="flex items-center justify-between py-2">
                <span className="text-sm text-[var(--color-text-primary)]">{item.label}</span>
                <button
                  onClick={() => updateNotifMutation.mutate({ [item.key]: !notifs[item.key] })}
                  className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', notifs[item.key] ? 'bg-primary-500' : 'bg-[var(--color-bg-tertiary)]')}
                >
                  <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform', notifs[item.key] ? 'translate-x-6' : 'translate-x-1')} />
                </button>
              </label>
            ))}
          </div>
        </TabContent>

        <TabContent value="privacy">
          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Privacy Settings</h2>
            <label className="flex items-center justify-between py-2">
              <span className="text-sm text-[var(--color-text-primary)]">Show Email</span>
              <button
                onClick={() => updatePrivacyMutation.mutate({ showEmail: !privacy.showEmail })}
                className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', privacy.showEmail ? 'bg-primary-500' : 'bg-[var(--color-bg-tertiary)]')}
              >
                <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform', privacy.showEmail ? 'translate-x-6' : 'translate-x-1')} />
              </button>
            </label>
            <label className="flex items-center justify-between py-2">
              <span className="text-sm text-[var(--color-text-primary)]">Show Phone</span>
              <button
                onClick={() => updatePrivacyMutation.mutate({ showPhone: !privacy.showPhone })}
                className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', privacy.showPhone ? 'bg-primary-500' : 'bg-[var(--color-bg-tertiary)]')}
              >
                <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform', privacy.showPhone ? 'translate-x-6' : 'translate-x-1')} />
              </button>
            </label>
            <label className="flex items-center justify-between py-2">
              <span className="text-sm text-[var(--color-text-primary)]">Show Online Status</span>
              <button
                onClick={() => updatePrivacyMutation.mutate({ showOnlineStatus: !privacy.showOnlineStatus })}
                className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', privacy.showOnlineStatus ? 'bg-primary-500' : 'bg-[var(--color-bg-tertiary)]')}
              >
                <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform', privacy.showOnlineStatus ? 'translate-x-6' : 'translate-x-1')} />
              </button>
            </label>
          </div>
        </TabContent>

        <TabContent value="blocked">
          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Blocked Users</h2>
            {isBlockedLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
            ) : blockedUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FiUserX size={48} className="text-[var(--color-text-muted)]" />
                <h3 className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">No blocked users</h3>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">You haven&apos;t blocked anyone yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {blockedUsers.map(blocked => (
                  <div key={blocked._id} className="flex items-center justify-between rounded-lg bg-[var(--color-bg-tertiary)] p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={blocked.user?.fullName} src={blocked.user?.profilePhoto} size="md" />
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{blocked.user?.fullName}</h3>
                        <p className="text-xs text-[var(--color-text-secondary)]">{blocked.user?.headline || 'MediConnect member'}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { if (window.confirm(`Unblock ${blocked.user?.fullName}?`)) unblockMutation.mutate(blocked.user?._id) }}
                      disabled={unblockMutation.isPending}
                    >
                      Unblock
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabContent>

        <TabContent value="appearance">
          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Appearance</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">Choose your preferred theme.</p>
            <div className="grid grid-cols-3 gap-3">
              {(['light', 'dark', 'system'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    'rounded-xl border-2 p-4 text-center transition-colors capitalize',
                    theme === t ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-[var(--color-border-primary)] hover:border-[var(--color-text-muted)]'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </TabContent>

        <TabContent value="language">
          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{t.settings.language}</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">Choose your preferred language.</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setLocale('en')}
                className={cn(
                  'rounded-xl border-2 p-4 text-center transition-colors font-medium',
                  locale === 'en' ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-[var(--color-border-primary)] hover:border-[var(--color-text-muted)]'
                )}
              >
                {t.settings.english}
              </button>
              <button
                onClick={() => setLocale('ar')}
                className={cn(
                  'rounded-xl border-2 p-4 text-center transition-colors font-medium',
                  locale === 'ar' ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-[var(--color-border-primary)] hover:border-[var(--color-text-muted)]'
                )}
              >
                {t.settings.arabic}
              </button>
            </div>
          </div>
        </TabContent>

        <TabContent value="account">
          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Account Settings</h2>
            <div className="rounded-lg bg-[var(--color-bg-tertiary)] p-4">
              <p className="text-sm text-[var(--color-text-primary)] font-medium">Email</p>
              <p className="text-sm text-[var(--color-text-secondary)]">{user?.email}</p>
            </div>
            <div className="rounded-lg bg-[var(--color-bg-tertiary)] p-4">
              <p className="text-sm text-[var(--color-text-primary)] font-medium">Role</p>
              <p className="text-sm text-[var(--color-text-secondary)] capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>

            <div className="border-t border-[var(--color-border-primary)] pt-4 space-y-3">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <FiMail size={14} /> Update Email
              </h3>
              <Input label="New Email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="new@email.com" />
              <Input label="Current Password" type="password" value={emailPassword} onChange={e => setEmailPassword(e.target.value)} placeholder="Confirm your password" />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => updateEmailMutation.mutate({ newEmail, password: emailPassword })}
                  isLoading={updateEmailMutation.isPending}
                  disabled={!newEmail || !emailPassword}
                >
                  Update Email
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-red-50 border border-red-200 p-4 mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <FiAlertTriangle size={16} className="text-red-600" />
                <p className="text-sm font-medium text-red-600">Deactivate Account</p>
              </div>
              <p className="text-xs text-red-500">Deactivating will hide your profile and data. You can reactivate by logging in again.</p>
              {!showDeactivateConfirm ? (
                <Button variant="danger" size="sm" onClick={() => setShowDeactivateConfirm(true)}>
                  Deactivate Account
                </Button>
              ) : (
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Enter password to confirm"
                    value={deactivatePassword}
                    onChange={e => setDeactivatePassword(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => deactivateMutation.mutate(deactivatePassword)}
                      isLoading={deactivateMutation.isPending}
                      disabled={!deactivatePassword}
                    >
                      Confirm Deactivation
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setShowDeactivateConfirm(false); setDeactivatePassword('') }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg bg-red-50 border border-red-200 p-4 mt-4">
              <p className="text-sm font-medium text-red-600">Danger Zone</p>
              <p className="text-xs text-red-500 mt-1">Deleting your account is permanent and cannot be undone.</p>
              <Button variant="danger" size="sm" className="mt-3" onClick={() => { if (confirm('Are you sure you want to delete your account?')) settingsService.deleteAccount() }}>
                Delete Account
              </Button>
            </div>
          </div>
        </TabContent>
      </Tabs>
    </motion.div>
  )
}
