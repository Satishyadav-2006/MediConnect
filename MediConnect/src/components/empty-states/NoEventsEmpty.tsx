import { FiCalendar } from 'react-icons/fi'
import { useI18n } from '@/config/i18n'
import EmptyState from './EmptyState'

export default function NoEventsEmpty() {
  const { t } = useI18n()
  return <EmptyState icon={<FiCalendar size={48} />} title={t.events.noEventsFound} description="Check back later for upcoming events." />
}
