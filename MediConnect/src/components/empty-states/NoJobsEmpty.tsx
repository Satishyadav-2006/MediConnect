import { FiBriefcase } from 'react-icons/fi'
import { useI18n } from '@/config/i18n'
import EmptyState from './EmptyState'

export default function NoJobsEmpty() {
  const { t } = useI18n()
  return <EmptyState icon={<FiBriefcase size={48} />} title={t.jobs.noJobsFound} description={t.jobs.adjustFilters} />
}
