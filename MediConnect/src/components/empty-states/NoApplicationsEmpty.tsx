import { FiFileText } from 'react-icons/fi'
import { useI18n } from '@/config/i18n'
import EmptyState from './EmptyState'

export default function NoApplicationsEmpty() {
  const { t } = useI18n()
  return (
    <EmptyState
      icon={<FiFileText size={48} />}
      title="No applications yet"
      description="Browse opportunities and apply to get started."
      action={{ label: t.jobs.findJobs, onClick: () => {} }}
    />
  )
}
