import { FiUsers } from 'react-icons/fi'
import { useI18n } from '@/config/i18n'
import EmptyState from './EmptyState'

export default function NoConnectionsEmpty() {
  const { t } = useI18n()
  return <EmptyState icon={<FiUsers size={48} />} title={t.connections.noConnections} description="Start building your professional network." />
}
