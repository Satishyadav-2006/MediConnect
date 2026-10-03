import { Link } from 'react-router-dom'
import { FiAlertCircle } from 'react-icons/fi'
import type { User } from '@/types'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'

interface ProfileCompletionCardProps {
  user: User
}

export default function ProfileCompletionCard({ user }: ProfileCompletionCardProps) {
  const sections = [
    { label: 'Profile Photo', completed: !!user.profilePhoto },
    { label: 'Headline', completed: !!user.headline },
    { label: 'Bio', completed: !!user.bio },
    { label: 'Location', completed: !!user.location },
    { label: 'Specialization', completed: !!user.specialization },
    { label: 'Experience', completed: user.experience.length > 0 },
    { label: 'Education', completed: user.education.length > 0 },
    { label: 'Skills', completed: user.skills.length > 0 },
  ]

  const completedCount = sections.filter(s => s.completed).length
  const percentage = Math.round((completedCount / sections.length) * 100)
  const missingSections = sections.filter(s => !s.completed)

  if (percentage === 100) return null

  return (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Profile Completion</h3>
        <span className="text-sm font-bold text-primary-500">{percentage}%</span>
      </div>

      <ProgressBar value={percentage} color="primary" size="md" />

      <p className="mt-3 text-xs text-[var(--color-text-muted)]">
        {percentage < 50
          ? "Complete your profile to increase visibility and connect with professionals."
          : percentage < 80
            ? "You're almost there! Add the remaining sections to stand out."
            : "Just a few more details to make your profile complete."}
      </p>

      {missingSections.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {missingSections.map(section => (
            <div key={section.label} className="flex items-center gap-2 text-xs">
              <FiAlertCircle size={12} className="shrink-0 text-warning-500" />
              <span className="text-[var(--color-text-secondary)]">{section.label}</span>
            </div>
          ))}
        </div>
      )}

      <Link to="/profile/edit">
        <Button variant="primary" size="sm" fullWidth className="mt-4">
          Complete Your Profile
        </Button>
      </Link>
    </div>
  )
}
