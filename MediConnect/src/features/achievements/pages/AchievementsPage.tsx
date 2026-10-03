import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiAward, FiTrendingUp, FiCheck, FiInfo } from 'react-icons/fi'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import Skeleton from '@/components/ui/Skeleton'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Tabs, TabList, TabTrigger, TabContent } from '@/components/ui/Tabs'
import AchievementCard from '@/components/achievements/AchievementCard'
import AchievementProgress from '@/components/achievements/AchievementProgress'
import { useAchievements, useAchievementProgress, useLeaderboard } from '../hooks/useAchievements'
import type { Achievement } from '@/types'

const ACHIEVEMENT_DEFINITIONS: (Omit<Achievement, '_id'> & { _id?: string; current?: number; target?: number })[] = [
  { title: 'First Post', description: 'Published your first post on MediConnect', icon: '👋', category: 'content', current: 1, target: 1 },
  { title: 'First Connection', description: 'Made your first professional connection', icon: '🤝', category: 'social', current: 1, target: 1 },
  { title: '100 Connections', description: 'Built a network of 100 healthcare professionals', icon: '🔗', category: 'social', current: 45, target: 100 },
  { title: 'Profile Pioneer', description: 'Completed 100% of your profile', icon: '⭐', category: 'profile', current: 8, target: 10 },
  { title: 'Rising Star', description: 'Received 50 likes on your posts', icon: '🌟', category: 'content', current: 32, target: 50 },
  { title: 'Commentator', description: 'Left 25 meaningful comments', icon: '💬', category: 'content', current: 12, target: 25 },
  { title: 'Job Seeker', description: 'Applied to 5 job positions', icon: '🎯', category: 'professional', current: 2, target: 5 },
  { title: 'Mentor', description: 'Became a mentor for junior professionals', icon: '🎓', category: 'mentorship', current: 0, target: 1 },
  { title: 'Top Contributor', description: 'Top 10% contributor this month', icon: '🏆', category: 'content', current: 0, target: 1 },
  { title: 'Early Adopter', description: 'Joined MediConnect in the first month', icon: '⚡', category: 'profile', current: 1, target: 1 },
  { title: 'Event Host', description: 'Hosted your first professional event', icon: '🎤', category: 'organization', current: 0, target: 1 },
  { title: 'Research Sharer', description: 'Shared 3 research publications', icon: '📚', category: 'content', current: 1, target: 3 },
  { title: 'Networking Pro', description: 'Attended 5 professional events', icon: '🌐', category: 'social', current: 3, target: 5 },
  { title: 'Knowledge Builder', description: 'Earned 3 professional certifications', icon: '📜', category: 'professional', current: 1, target: 3 },
  { title: 'Community Leader', description: 'Reached 200 followers', icon: '👥', category: 'social', current: 89, target: 200 },
  { title: 'Healthcare Hero', description: 'Made 500 connections', icon: '🦸', category: 'social', current: 45, target: 500 },
  { title: 'Mentorship Master', description: 'Completed 10 mentorship sessions', icon: '🧠', category: 'mentorship', current: 3, target: 10 },
  { title: 'Organization Builder', description: 'Created and managed an organization', icon: '🏢', category: 'organization', current: 0, target: 1 },
]

const CATEGORIES = ['All', 'Profile', 'Social', 'Content', 'Mentorship', 'Professional', 'Organization']

export default function AchievementsPage() {
  const { data: achievementsData, isLoading: achievementsLoading } = useAchievements()
  const { data: progressData, isLoading: progressLoading } = useAchievementProgress()
  const { data: leaderboardData, isLoading: leaderboardLoading } = useLeaderboard()

  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedAchievement, setSelectedAchievement] = useState<(typeof ACHIEVEMENT_DEFINITIONS)[number] & { earned?: boolean; earnedAt?: string } | null>(null)

  const earnedFromApi = useMemo(
    () => (achievementsData?.data?.achievements || achievementsData?.achievements || []) as Achievement[],
    [achievementsData]
  )

  const earnedTitles = useMemo(() => new Set(earnedFromApi.map(a => a.title)), [earnedFromApi])

  const allAchievements = useMemo(() => {
    return ACHIEVEMENT_DEFINITIONS.map(def => {
      const earned = earnedFromApi.find(e => e.title === def.title)
      return {
        ...def,
        _id: earned?._id || def.title,
        earned: !!earned || earnedTitles.has(def.title),
        earnedAt: earned?.earnedAt,
        current: earned ? def.target : (progressData?.data?.[def.title]?.current ?? def.current ?? 0),
      }
    })
  }, [earnedFromApi, earnedTitles, progressData])

  const earned = useMemo(() => allAchievements.filter(a => a.earned), [allAchievements])
  const available = useMemo(() => allAchievements.filter(a => !a.earned), [allAchievements])

  const filteredEarned = useMemo(
    () => selectedCategory === 'All' ? earned : earned.filter(a => a.category.toLowerCase() === selectedCategory.toLowerCase()),
    [earned, selectedCategory]
  )

  const filteredAvailable = useMemo(
    () => selectedCategory === 'All' ? available : available.filter(a => a.category.toLowerCase() === selectedCategory.toLowerCase()),
    [available, selectedCategory]
  )

  const isLoading = achievementsLoading || progressLoading

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-xl border border-[var(--color-border-primary)] bg-gradient-to-r from-primary-500 to-primary-700 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <FiAward size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Achievements</h1>
            <p className="text-sm text-white/80">
              You've earned {earned.length} of {allAchievements.length} achievements. Keep going!
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <FiCheck size={16} />
            <span className="text-sm font-medium">{earned.length} Earned</span>
          </div>
          <div className="flex items-center gap-2">
            <FiTrendingUp size={16} />
            <span className="text-sm font-medium">{available.length} In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <FiInfo size={16} />
            <span className="text-sm font-medium">{allAchievements.length - earned.length - available.length + available.length} Total</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={(v) => setSelectedCategory(v === 'all' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1))}>
        <TabList className="overflow-x-auto">
          {CATEGORIES.map(cat => (
            <TabTrigger key={cat} value={cat.toLowerCase()}>{cat}</TabTrigger>
          ))}
        </TabList>

        <TabContent value="all">
          <AchievementSection
            isLoading={isLoading}
            earned={filteredEarned}
            available={filteredAvailable}
            onSelect={setSelectedAchievement}
          />
        </TabContent>
        {CATEGORIES.slice(1).map(cat => (
          <TabContent key={cat} value={cat.toLowerCase()}>
            <AchievementSection
              isLoading={isLoading}
              earned={filteredEarned}
              available={filteredAvailable}
              onSelect={setSelectedAchievement}
            />
          </TabContent>
        ))}
      </Tabs>

      {!leaderboardLoading && leaderboardData && (
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">Leaderboard</h3>
          <div className="space-y-3">
            {(leaderboardData?.data?.top || leaderboardData?.top || []).slice(0, 5).map((entry: { user: { fullName: string; profilePhoto?: string }; points: number; rank: number }, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 text-center text-sm font-bold text-[var(--color-text-muted)]">#{entry.rank}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{entry.user?.fullName}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{entry.points} points</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-600">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={!!selectedAchievement}
        onClose={() => setSelectedAchievement(null)}
        title={selectedAchievement?.title || ''}
        size="md"
      >
        {selectedAchievement && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-50 to-primary-100 text-4xl">
                {selectedAchievement.icon}
              </div>
              <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{selectedAchievement.description}</p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-[var(--color-text-muted)]">Category:</span>
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-600">
                {selectedAchievement.category}
              </span>
            </div>

            {selectedAchievement.earned && selectedAchievement.earnedAt ? (
              <div className="rounded-lg bg-accent-50 p-4 text-center">
                <FiCheck size={24} className="mx-auto text-accent-500" />
                <p className="mt-1 text-sm font-medium text-accent-700">Achievement Earned!</p>
                <p className="text-xs text-accent-600">Earned on {new Date(selectedAchievement.earnedAt).toLocaleDateString()}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center">
                  <AchievementProgress
                    current={selectedAchievement.current || 0}
                    target={selectedAchievement.target || 1}
                    size="lg"
                  />
                </div>
                <div className="rounded-lg bg-[var(--color-bg-tertiary)] p-4">
                  <h4 className="text-xs font-semibold text-[var(--color-text-primary)] mb-2">Required Actions</h4>
                  <ul className="space-y-1 text-xs text-[var(--color-text-secondary)]">
                    {selectedAchievement.category === 'social' && (
                      <li>• Connect with more healthcare professionals on the platform</li>
                    )}
                    {selectedAchievement.category === 'content' && (
                      <li>• Publish posts and engage with the community</li>
                    )}
                    {selectedAchievement.category === 'profile' && (
                      <li>• Complete all sections of your profile</li>
                    )}
                    {selectedAchievement.category === 'mentorship' && (
                      <li>• Offer mentorship sessions or become a mentor</li>
                    )}
                    {selectedAchievement.category === 'professional' && (
                      <li>• Apply for jobs or earn new certifications</li>
                    )}
                    {selectedAchievement.category === 'organization' && (
                      <li>• Create or manage an organization</li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {selectedAchievement.earned && (
              <Button variant="outline" fullWidth onClick={() => setSelectedAchievement(null)}>
                Close
              </Button>
            )}
          </div>
        )}
      </Modal>
    </motion.div>
  )
}

function AchievementSection({
  isLoading,
  earned,
  available,
  onSelect,
}: {
  isLoading: boolean
  earned: (typeof ACHIEVEMENT_DEFINITIONS)[number][]
  available: (typeof ACHIEVEMENT_DEFINITIONS)[number][]
  onSelect: (a: (typeof ACHIEVEMENT_DEFINITIONS)[number]) => void
}) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Earned Achievements</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Available Achievements</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {earned.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
            Earned Achievements ({earned.length})
          </h3>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {earned.map(a => (
              <motion.div key={a._id} variants={staggerItem}>
                <AchievementCard
                  icon={a.icon}
                  title={a.title}
                  description={a.description}
                  category={a.category}
                  earned
                  earnedAt={a.earnedAt}
                  onClick={() => onSelect(a)}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {available.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
            Available Achievements ({available.length})
          </h3>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {available.map(a => (
              <motion.div key={a._id} variants={staggerItem}>
                <AchievementCard
                  icon={a.icon}
                  title={a.title}
                  description={a.description}
                  category={a.category}
                  current={a.current || 0}
                  target={a.target || 1}
                  onClick={() => onSelect(a)}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {earned.length === 0 && available.length === 0 && (
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-8 text-center">
          <FiAward size={48} className="mx-auto text-[var(--color-text-muted)] mb-4" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">No achievements in this category</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Check back later for new achievements!</p>
        </div>
      )}
    </div>
  )
}
