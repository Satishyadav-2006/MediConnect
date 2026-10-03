import { FiFileText } from 'react-icons/fi'
import { useI18n } from '@/config/i18n'
import EmptyState from './EmptyState'

export default function NoPostsEmpty() {
  const { t } = useI18n()
  return <EmptyState icon={<FiFileText size={48} />} title={t.feed.noPostsYet} description={t.feed.beFirstToPost} />
}
