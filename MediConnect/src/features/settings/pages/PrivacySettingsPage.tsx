import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsService } from '@/api/settingsService'
import { pageTransition } from '@/animations'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import { cn } from '@/utils'

interface PrivacyData {
  profileVisibility: 'public' | 'connections' | 'private'
  showEmail: boolean
  showPhone: boolean
  showOnlineStatus: boolean
  allowMessages: 'everyone' | 'connections' | 'nobody'
  showFollowers: boolean
  showConnections: boolean
  showPosts: boolean
  showLastSeen: boolean
  searchableBySearchEngines: boolean
}

function ToggleSwitch({ enabled, onToggle, disabled }: { enabled: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        enabled ? 'bg-primary-500' : 'bg-[var(--color-bg-tertiary)]',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span className={cn(
        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
        enabled ? 'translate-x-6' : 'translate-x-1'
      )} />
    </button>
  )
}

export default function PrivacySettingsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['privacySettings'],
    queryFn: () => settingsService.getPrivacySettings().then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: (settings: Partial<PrivacyData>) => settingsService.updatePrivacySettings(settings),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['privacySettings'] })
      toast.success('Privacy settings updated')
    },
    onError: () => toast.error('Failed to update privacy settings'),
  })

  const privacy = (data?.data || data || {}) as Partial<PrivacyData>

  const toggleSetting = (key: keyof PrivacyData, value: any) => {
    updateMutation.mutate({ [key]: value })
  }

  const VISIBILITY_OPTIONS = [
    { value: 'public', label: 'Public', description: 'Anyone on MediConnect can see your profile' },
    { value: 'connections', label: 'Connections Only', description: 'Only your connections can see your profile' },
    { value: 'private', label: 'Private', description: 'Only you can see your profile' },
  ]

  const TOGGLE_SETTINGS = [
    { key: 'showEmail' as const, label: 'Show Email', description: 'Display your email address on your profile' },
    { key: 'showPhone' as const, label: 'Show Phone', description: 'Display your phone number on your profile' },
    { key: 'showOnlineStatus' as const, label: 'Show Online Status', description: 'Let others see when you are online' },
    { key: 'showFollowers' as const, label: 'Show Followers', description: 'Display your followers list on your profile' },
    { key: 'showConnections' as const, label: 'Show Connections', description: 'Display your connections list on your profile' },
    { key: 'showPosts' as const, label: 'Show Posts', description: 'Allow others to see your posts on your profile' },
    { key: 'showLastSeen' as const, label: 'Show Last Seen', description: 'Display when you were last active' },
    { key: 'searchableBySearchEngines' as const, label: 'Search Engine Visibility', description: 'Allow your profile to appear in search engine results' },
  ]

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Privacy Settings</h1>

      <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Profile Visibility</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">Control who can see your profile</p>
        <div className="space-y-2">
          {VISIBILITY_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => toggleSetting('profileVisibility', option.value)}
              className={cn(
                'w-full flex items-center justify-between rounded-lg border p-4 text-left transition-colors',
                privacy.profileVisibility === option.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-[var(--color-border-primary)] hover:border-[var(--color-text-muted)]'
              )}
            >
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{option.label}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{option.description}</p>
              </div>
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                privacy.profileVisibility === option.value ? 'border-primary-500' : 'border-[var(--color-border-primary)]'
              )}>
                {privacy.profileVisibility === option.value && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Message Requests</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">Control who can send you messages</p>
        <div className="space-y-2">
          {[
            { value: 'everyone', label: 'Everyone', description: 'Anyone can send you messages' },
            { value: 'connections', label: 'Connections Only', description: 'Only your connections can message you' },
            { value: 'nobody', label: 'Nobody', description: 'Disable message requests' },
          ].map(option => (
            <button
              key={option.value}
              onClick={() => toggleSetting('allowMessages', option.value)}
              className={cn(
                'w-full flex items-center justify-between rounded-lg border p-4 text-left transition-colors',
                privacy.allowMessages === option.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-[var(--color-border-primary)] hover:border-[var(--color-text-muted)]'
              )}
            >
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{option.label}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{option.description}</p>
              </div>
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                privacy.allowMessages === option.value ? 'border-primary-500' : 'border-[var(--color-border-primary)]'
              )}>
                {privacy.allowMessages === option.value && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-1">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Visibility Options</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
          </div>
        ) : (
          TOGGLE_SETTINGS.map(setting => (
            <label key={setting.key} className="flex items-center justify-between py-3">
              <div>
                <span className="text-sm text-[var(--color-text-primary)]">{setting.label}</span>
                <p className="text-xs text-[var(--color-text-muted)]">{setting.description}</p>
              </div>
              <ToggleSwitch
                enabled={!!privacy[setting.key]}
                onToggle={() => toggleSetting(setting.key, !privacy[setting.key])}
                disabled={updateMutation.isPending}
              />
            </label>
          ))
        )}
      </div>
    </motion.div>
  )
}
