import { FiSearch } from 'react-icons/fi'
import { useI18n } from '@/config/i18n'
import EmptyState from './EmptyState'

export default function NoResultsEmpty() {
  const { t } = useI18n()
  return (
    <EmptyState
      icon={<FiSearch size={48} />}
      title={t.common.noResults}
      description={t.search.tryDifferent}
    />
  )
}
