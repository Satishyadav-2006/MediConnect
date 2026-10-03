import { useState, useEffect } from 'react'
import { FiSettings } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminSettings } from '@/features/admin/hooks/useAdmin'
import { useI18n } from '@/config/i18n'
import {
  AdminErrorState,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminLoadingCards,
} from '@/components/admin'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Toggle from '@/components/ui/Toggle'

export default function AdminSettingsPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'
  const { data, isLoading, isError, updateMutation } = useAdminSettings()

  const [allowRegistrations, setAllowRegistrations] = useState(true)
  const [requireVerification, setRequireVerification] = useState(true)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maxUploadSize, setMaxUploadSize] = useState(10)

  useEffect(() => {
    if (data) {
      setAllowRegistrations(data.registration_enabled !== false)
      setRequireVerification(data.verification_required !== false)
      setMaintenanceMode(data.maintenance_mode === true)
      setMaxUploadSize(Math.round((data.max_upload_size ?? 10485760) / 1048576))
    }
  }, [data])

  const handleSave = () => {
    updateMutation.mutate({
      registration_enabled: allowRegistrations,
      verification_required: requireVerification,
      maintenance_mode: maintenanceMode,
      max_upload_size: Math.round(maxUploadSize * 1048576),
    })
  }

  if (isLoading) {
    return (
      <AdminPage>
        <AdminLoadingCards count={2} className="h-48" />
      </AdminPage>
    )
  }

  if (!isSuperAdmin || isError) {
    return (
      <AdminPage>
        <AdminErrorState
          title="Settings are restricted"
          description="Platform settings require a super admin account."
        />
      </AdminPage>
    )
  }

  return (
    <AdminPage>
      <AdminPageHeader
        title={t.admin.titles.settings}
        subtitle={t.admin.subtitle.settings}
        icon={<FiSettings size={20} />}
      />
      <AdminPanel className="space-y-6 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">General</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Control registration, verification and maintenance mode</p>
          </div>
          <Button onClick={handleSave} isLoading={updateMutation.isPending}>Save changes</Button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] p-4">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Allow registrations</p>
              <p className="text-xs text-[var(--color-text-muted)]">Enable new user sign ups</p>
            </div>
            <Toggle checked={allowRegistrations} onChange={setAllowRegistrations} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] p-4">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Require verification</p>
              <p className="text-xs text-[var(--color-text-muted)]">New accounts require email verification</p>
            </div>
            <Toggle checked={requireVerification} onChange={setRequireVerification} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] p-4">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Maintenance mode</p>
              <p className="text-xs text-[var(--color-text-muted)]">Temporarily restrict access to the platform</p>
            </div>
            <Toggle checked={maintenanceMode} onChange={setMaintenanceMode} />
          </div>
          <div className="rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] p-4">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Max upload size (MB)</p>
            <p className="mb-2 text-xs text-[var(--color-text-muted)]">Limit file uploads across the platform</p>
            <Input type="number" min="1" value={maxUploadSize} onChange={e => setMaxUploadSize(Number(e.target.value))} className="max-w-xs" />
          </div>
        </div>
      </AdminPanel>
    </AdminPage>
  )
}