import { FiUsers } from 'react-icons/fi'
import { format } from 'date-fns'
import { formatNumber } from '@/utils'
import { useI18n } from '@/config/i18n'
import type { User } from '@/types'

interface WelcomeBannerProps {
  user: User
}

export default function WelcomeBanner({ user }: WelcomeBannerProps) {
  const { t } = useI18n()
  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 p-6 text-white">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/20" />
        <div className="absolute right-1/3 bottom-0 h-24 w-24 rounded-full bg-white/10" />
      </div>

      <div className="relative">
        <h1 className="text-2xl font-bold">
          {greeting()}, {user.fullName.split(' ')[0]}!
        </h1>
        <p className="mt-1 text-sm text-white/80">
          {format(new Date(), 'EEEE, MMMM d, yyyy')} · Stay connected with your healthcare network.
        </p>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 backdrop-blur-sm">
            <FiUsers size={16} />
            <div>
              <p className="text-sm font-semibold">{formatNumber(user.connectionsCount)}</p>
              <p className="text-[10px] text-white/70">{t.profile.connections}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 backdrop-blur-sm">
            <FiUsers size={16} />
            <div>
              <p className="text-sm font-semibold">{formatNumber(user.followersCount)}</p>
              <p className="text-[10px] text-white/70">{t.profile.followers}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
