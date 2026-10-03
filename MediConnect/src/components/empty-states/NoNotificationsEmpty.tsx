import { FiBell } from 'react-icons/fi'
import { useI18n } from '@/config/i18n'
import EmptyState from './EmptyState'

export default function NoNotificationsEmpty() {
  const { t } = useI18n()
  return <EmptyState icon={<FiBell size={48} />} title={t.notifications.noNotifications} description="You're all caught up!" />
}
