import { FiAward } from 'react-icons/fi'
import { useI18n } from '@/config/i18n'
import EmptyState from './EmptyState'

export default function NoAchievementsEmpty() {
  const { t } = useI18n()
  return (
    <EmptyState
      icon={<FiAward size={48} />}
      title={t.achievements.noAchievements}
      description="Complete your profile and start connecting to earn achievements."
      action={{ label: t.achievements.achievements, onClick: () => {} }}
    />
  )
}
