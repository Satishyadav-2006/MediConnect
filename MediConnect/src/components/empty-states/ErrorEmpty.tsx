import { FiAlertTriangle } from 'react-icons/fi'
import { useI18n } from '@/config/i18n'
import EmptyState from './EmptyState'

export default function ErrorEmpty({ onRetry }: { onRetry?: () => void }) {
  const { t } = useI18n()
  return (
    <EmptyState
      icon={<FiAlertTriangle size={48} />}
      title={t.common.error}
      description={t.common.retry}
      action={onRetry ? { label: t.common.tryAgain, onClick: onRetry } : undefined}
    />
  )
}
