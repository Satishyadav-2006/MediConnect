import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiArrowLeft, FiDownload, FiShare2, FiUsers, FiUserPlus, FiFileText,
  FiMessageCircle, FiHeart, FiBookOpen, FiBriefcase, FiCheckCircle,
  FiCalendar, FiMic, FiAward, FiStar, FiTarget, FiTrendingUp,
} from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import { LineChart, BarChart, StatsCard } from '@/components/ui/Charts'
import Timeline from '@/components/ui/Timeline'
import { formatNumber } from '@/utils'

const YEARS = [2024, 2025, 2026]

const SUMMARY_DATA: Record<number, {
  connections: number; followersGained: number; postsPublished: number;
  commentsReceived: number; likesReceived: number; researchShared: number;
  jobsApplied: number; interviews: number; eventsAttended: number;
  eventsHosted: number; certificatesEarned: number; mentorshipSessions: number;
  achievementsEarned: number;
  monthlyGrowth: { label: string; value: number }[];
  topPosts: { content: string; likes: number; comments: number }[];
  milestones: { title: string; description: string; date: string; status: 'completed' | 'active' | 'pending' }[];
}> = {
  2026: {
    connections: 247, followersGained: 189, postsPublished: 34,
    commentsReceived: 156, likesReceived: 423, researchShared: 5,
    jobsApplied: 3, interviews: 2, eventsAttended: 8,
    eventsHosted: 2, certificatesEarned: 1, mentorshipSessions: 12,
    achievementsEarned: 7,
    monthlyGrowth: [
      { label: 'Jan', value: 12 }, { label: 'Feb', value: 28 }, { label: 'Mar', value: 45 },
      { label: 'Apr', value: 67 }, { label: 'May', value: 89 }, { label: 'Jun', value: 124 },
      { label: 'Jul', value: 189 },
    ],
    topPosts: [
      { content: 'Just published my research on AI-assisted diagnostics in rural healthcare. Grateful for the collaboration!', likes: 87, comments: 23 },
      { content: 'Excited to share my experience at the Global Health Summit 2026. Key takeaway: interdisciplinary collaboration is the future.', likes: 64, comments: 18 },
      { content: 'Completed my Advanced Cardiology certification. 6 months of dedicated learning finally paying off.', likes: 52, comments: 14 },
    ],
    milestones: [
      { title: 'Account Verified', description: 'Professional healthcare credentials verified', date: 'Jan 15, 2026', status: 'completed' },
      { title: 'First 50 Connections', description: 'Built initial professional network', date: 'Feb 28, 2026', status: 'completed' },
      { title: 'Published Research', description: 'Shared first research publication', date: 'Mar 20, 2026', status: 'completed' },
      { title: 'Mentorship Milestone', description: 'Completed 10 mentorship sessions', date: 'Jun 10, 2026', status: 'completed' },
      { title: '200 Connections', description: 'Growing your professional network', date: 'In progress', status: 'active' },
    ],
  },
  2025: {
    connections: 156, followersGained: 98, postsPublished: 22,
    commentsReceived: 89, likesReceived: 234, researchShared: 2,
    jobsApplied: 5, interviews: 3, eventsAttended: 4,
    eventsHosted: 1, certificatesEarned: 2, mentorshipSessions: 6,
    achievementsEarned: 4,
    monthlyGrowth: [
      { label: 'Jan', value: 8 }, { label: 'Feb', value: 15 }, { label: 'Mar', value: 22 },
      { label: 'Apr', value: 31 }, { label: 'May', value: 45 }, { label: 'Jun', value: 58 },
      { label: 'Jul', value: 72 }, { label: 'Aug', value: 85 }, { label: 'Sep', value: 98 },
      { label: 'Oct', value: 115 }, { label: 'Nov', value: 132 }, { label: 'Dec', value: 156 },
    ],
    topPosts: [
      { content: 'Reflecting on my first year as a resident. The learning curve is steep but incredibly rewarding.', likes: 45, comments: 12 },
      { content: 'Attended the National Nurses Conference. So many inspiring speakers and sessions!', likes: 38, comments: 9 },
      { content: 'New publication: "Telemedicine Trends in Post-Pandemic Healthcare" - link in bio.', likes: 31, comments: 8 },
    ],
    milestones: [
      { title: 'Joined MediConnect', description: 'Started the healthcare networking journey', date: 'Jan 5, 2025', status: 'completed' },
      { title: 'First Post', description: 'Published first post on the platform', date: 'Jan 12, 2025', status: 'completed' },
      { title: '100 Connections', description: 'Reached 100 professional connections', date: 'Aug 15, 2025', status: 'completed' },
      { title: 'Became a Mentor', description: 'Started mentoring junior professionals', date: 'Oct 20, 2025', status: 'completed' },
    ],
  },
  2024: {
    connections: 34, followersGained: 12, postsPublished: 6,
    commentsReceived: 18, likesReceived: 45, researchShared: 0,
    jobsApplied: 1, interviews: 0, eventsAttended: 1,
    eventsHosted: 0, certificatesEarned: 0, mentorshipSessions: 0,
    achievementsEarned: 1,
    monthlyGrowth: [
      { label: 'Jan', value: 0 }, { label: 'Feb', value: 0 }, { label: 'Mar', value: 0 },
      { label: 'Apr', value: 0 }, { label: 'May', value: 0 }, { label: 'Jun', value: 0 },
      { label: 'Jul', value: 0 }, { label: 'Aug', value: 0 }, { label: 'Sep', value: 0 },
      { label: 'Oct', value: 0 }, { label: 'Nov', value: 0 }, { label: 'Dec', value: 34 },
    ],
    topPosts: [
      { content: 'Just discovered MediConnect! Looking forward to connecting with fellow healthcare professionals.', likes: 12, comments: 4 },
    ],
    milestones: [
      { title: 'Early Adopter', description: 'Joined MediConnect in its launch month', date: 'Dec 1, 2024', status: 'completed' },
    ],
  },
}

function useAnimatedCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration])

  return count
}

function AnimatedStat({
  icon, label, value, delay = 0,
}: {
  icon: React.ReactNode; label: string; value: number; delay?: number
}) {
  const animatedValue = useAnimatedCounter(value, 1500)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex flex-col items-center gap-2 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4 text-center"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
        {icon}
      </div>
      <span className="text-2xl font-bold text-[var(--color-text-primary)]">{formatNumber(animatedValue)}</span>
      <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
    </motion.div>
  )
}

export default function AnnualSummaryPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedYear, setSelectedYear] = useState(2026)
  const data = SUMMARY_DATA[selectedYear]

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <FiArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Annual Professional Summary</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 p-8 text-white"
      >
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-4">
          <Avatar
            src={user?.profilePhoto}
            name={user?.fullName || ''}
            size="xl"
            className="h-20 w-20 border-3 border-white/30"
          />
          <div>
            <p className="text-sm text-white/70">Your Year in Review</p>
            <h2 className="text-2xl font-bold">{user?.fullName || 'Healthcare Professional'}</h2>
            <p className="mt-1 text-sm text-white/80 italic">
              "{getQuote(selectedYear)}"
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          {YEARS.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                selectedYear === year
                  ? 'bg-white text-primary-700 shadow-lg'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </motion.div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">Your Stats at a Glance</h3>
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <AnimatedStat icon={<FiUserPlus size={18} />} label="Connections Made" value={data.connections} delay={0} />
          <AnimatedStat icon={<FiUsers size={18} />} label="Followers Gained" value={data.followersGained} delay={0.05} />
          <AnimatedStat icon={<FiFileText size={18} />} label="Posts Published" value={data.postsPublished} delay={0.1} />
          <AnimatedStat icon={<FiMessageCircle size={18} />} label="Comments Received" value={data.commentsReceived} delay={0.15} />
          <AnimatedStat icon={<FiHeart size={18} />} label="Likes Received" value={data.likesReceived} delay={0.2} />
          <AnimatedStat icon={<FiBookOpen size={18} />} label="Research Shared" value={data.researchShared} delay={0.25} />
          <AnimatedStat icon={<FiBriefcase size={18} />} label="Jobs Applied" value={data.jobsApplied} delay={0.3} />
          <AnimatedStat icon={<FiCheckCircle size={18} />} label="Interviews" value={data.interviews} delay={0.35} />
          <AnimatedStat icon={<FiCalendar size={18} />} label="Events Attended" value={data.eventsAttended} delay={0.4} />
          <AnimatedStat icon={<FiMic size={18} />} label="Events Hosted" value={data.eventsHosted} delay={0.45} />
          <AnimatedStat icon={<FiAward size={18} />} label="Certificates Earned" value={data.certificatesEarned} delay={0.5} />
          <AnimatedStat icon={<FiTarget size={18} />} label="Mentorship Sessions" value={data.mentorshipSessions} delay={0.55} />
          <AnimatedStat icon={<FiStar size={18} />} label="Achievements Earned" value={data.achievementsEarned} delay={0.6} />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6"
      >
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          <FiTrendingUp size={18} className="inline mr-2 text-primary-500" />
          Growth Over Time
        </h3>
        <LineChart data={data.monthlyGrowth} height={220} />
      </motion.div>

      {data.topPosts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6"
        >
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Top Posts by Engagement</h3>
          <div className="space-y-4">
            {data.topPosts.map((post, i) => (
              <div key={i} className="flex gap-3 rounded-lg bg-[var(--color-bg-tertiary)] p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-sm font-bold text-primary-500">
                  #{i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[var(--color-text-primary)] line-clamp-2">{post.content}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1"><FiHeart size={12} /> {post.likes} likes</span>
                    <span className="flex items-center gap-1"><FiMessageCircle size={12} /> {post.comments} comments</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {data.milestones.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6"
        >
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Professional Milestones</h3>
          <Timeline items={data.milestones} />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6"
      >
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Share Your Achievements</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Download your professional summary or share it with your network.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" leftIcon={<FiDownload size={16} />}>
            Download PDF
          </Button>
          <Button leftIcon={<FiShare2 size={16} />}>
            Share Summary
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function getQuote(year: number): string {
  const quotes: Record<number, string> = {
    2026: 'A year of accelerated growth, mentorship, and impactful research.',
    2025: 'Building foundations, forming connections, and growing as a healthcare professional.',
    2024: 'The beginning of a meaningful healthcare networking journey.',
  }
  return quotes[year] || ''
}
