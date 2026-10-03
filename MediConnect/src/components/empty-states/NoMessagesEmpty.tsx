import { FiMessageSquare } from 'react-icons/fi'
import { useI18n } from '@/config/i18n'
import EmptyState from './EmptyState'

export default function NoMessagesEmpty() {
  const { t } = useI18n()
  return <EmptyState icon={<FiMessageSquare size={48} />} title={t.messages.noMessages} description="Start a conversation with your connections." />
}
