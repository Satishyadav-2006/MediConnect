import { FiSearch } from 'react-icons/fi'
import { useI18n } from '@/config/i18n'
import EmptyState from './EmptyState'

export default function NoSearchResultsEmpty() {
  const { t } = useI18n()
  return <EmptyState icon={<FiSearch size={48} />} title={t.search.noResults} description={t.search.tryDifferent} />
}
