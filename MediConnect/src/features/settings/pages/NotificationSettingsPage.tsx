import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsService } from '@/api/settingsService'
import { pageTransition } from '@/animations'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import { cn } from '@/utils'
import { FiSave } from 'react-icons/fi'
import { useState, useEffect } from 'react'

interface NotificationSettingsData {
  jobs: boolean
  jobAlerts: boolean
  events: boolean
  eventReminders: boolean
  messages: boolean
  connectionRequests: boolean
  connections: boolean
  followers: boolean
  mentorship: boolean
  mentorshipUpdates: boolean
  organizations: boolean
  systemUpdates: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  inAppNotifications: boolean
}

const TOGGLE_GROUPS = [
  {
    title: 'Jobs',
    description: 'Notifications about job postings and applications',
    settings: [
      { key: 'jobs' as const, label: 'Job Postings' },
      { key: 'jobAlerts' as const, label: 'Job Alerts' },
    ],
  },
  {
    title: 'Events',
    description: 'Notifications about events you may be interested in',
    settings: [
      { key: 'events' as const, label: 'Event Updates' },
      { key: 'eventReminders' as const, label: 'Event Reminders' },
    ],
  },
  {
    title: 'Messages',
    description: 'Notifications for new messages',
    settings: [
      { key: 'messages' as const, label: 'Direct Messages' },
    ],
  },
  {
    title: 'Internships',
    description: 'Notifications about internship opportunities',
    settings: [
      { key: 'organizations' as const, label: 'Internship Updates' },
    ],
  },
  {
    title: 'Connections',
    description: 'Notifications about your professional network',
    settings: [
      { key: 'connectionRequests' as const, label: 'Connection Requests' },
      { key: 'connections' as const, label: 'Connection Updates' },
      { key: 'followers' as const, label: 'New Followers' },
    ],
  },
  {
    title: 'Mentorship',
    description: 'Notifications related to mentorship activities',
    settings: [
      { key: 'mentorship' as const, label: 'Mentorship Requests' },
      { key: 'mentorshipUpdates' as const, label: 'Mentorship Updates' },
    ],
  },
  {
    title: 'System',
    description: 'System and security notifications',
    settings: [
      { key: 'systemUpdates' as const, label: 'System Updates' },
    ],
  },
]

const CHANNEL_SETTINGS = [
  { key: 'emailNotifications' as const, label: 'Email Notifications', description: 'Receive notifications via email' },
  { key: 'pushNotifications' as const, label: 'Push Notifications', description: 'Receive push notifications in your browser' },
  { key: 'inAppNotifications' as const, label: 'In-App Notifications', description: 'Show notifications within the app' },
]

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

export default function NotificationSettingsPage() {
  const qc = useQueryClient()
  const [settings, setSettings] = useState<Partial<NotificationSettingsData>>({})
  const [hasChanges, setHasChanges] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['notificationSettings'],
    queryFn: () => settingsService.getNotificationSettings().then(r => r.data),
  })

  useEffect(() => {
    const notifData = data?.data || data || {}
    setSettings(notifData)
  }, [data])

  const saveMutation = useMutation({
    mutationFn: (newSettings: Record<string, boolean>) => settingsService.updateNotificationSettings(newSettings),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notificationSettings'] })
      setHasChanges(false)
      toast.success('Notification settings saved')
    },
    onError: () => toast.error('Failed to save notification settings'),
  })

  const toggleSetting = (key: keyof NotificationSettingsData) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    setHasChanges(true)
  }

  const handleSave = () => {
    saveMutation.mutate(settings as Record<string, boolean>)
  }

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Notification Settings</h1>
        {hasChanges && (
          <Button onClick={handleSave} isLoading={saveMutation.isPending} leftIcon={<FiSave size={14} />}>
            Save Changes
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-6">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Notification Channels</h2>
        {CHANNEL_SETTINGS.map(setting => (
          <label key={setting.key} className="flex items-center justify-between py-2">
            <div>
              <span className="text-sm text-[var(--color-text-primary)]">{setting.label}</span>
              <p className="text-xs text-[var(--color-text-muted)]">{setting.description}</p>
            </div>
            <ToggleSwitch
              enabled={!!settings[setting.key]}
              onToggle={() => toggleSetting(setting.key)}
            />
          </label>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              {[1, 2].map(j => <Skeleton key={j} className="h-12 w-full rounded-lg mb-2" />)}
            </div>
          ))}
        </div>
      ) : (
        TOGGLE_GROUPS.map(group => (
          <div key={group.title} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-1">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{group.title}</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">{group.description}</p>
            {group.settings.map(setting => (
              <label key={setting.key} className="flex items-center justify-between py-3">
                <span className="text-sm text-[var(--color-text-primary)]">{setting.label}</span>
                <ToggleSwitch
                  enabled={!!settings[setting.key]}
                  onToggle={() => toggleSetting(setting.key)}
                />
              </label>
            ))}
          </div>
        ))
      )}
    </motion.div>
  )
}
