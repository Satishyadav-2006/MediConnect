import { useState } from 'react'
import { FiEdit2, FiX } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import type { User } from '@/types'
import Chip from '@/components/ui/Chip'
import Input from '@/components/ui/Input'

interface SkillsCardProps {
  user: User
  isOwnProfile?: boolean
  onUpdateSkills?: (skills: string[]) => void
}

const MAX_VISIBLE = 12

export default function SkillsCard({ user, isOwnProfile, onUpdateSkills }: SkillsCardProps) {
  const [showAll, setShowAll] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newSkill, setNewSkill] = useState('')

  const skills = user.skills
  const visibleSkills = showAll ? skills : skills.slice(0, MAX_VISIBLE)
  const hiddenCount = skills.length - MAX_VISIBLE

  const handleAddSkill = () => {
    const skill = newSkill.trim()
    if (skill && !skills.includes(skill)) {
      onUpdateSkills?.([...skills, skill])
      setNewSkill('')
      setIsAdding(false)
    }
  }

  const handleRemoveSkill = (skill: string) => {
    onUpdateSkills?.(skills.filter(s => s !== skill))
  }

  return (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Skills</h3>
        {isOwnProfile && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-primary-500 transition-colors"
          >
            <FiEdit2 size={16} />
          </button>
        )}
      </div>

      {skills.length === 0 && !isAdding ? (
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">No skills added yet.</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleSkills.map(skill => (
            <Chip
              key={skill}
              removable={isOwnProfile && isAdding}
              onRemove={() => handleRemoveSkill(skill)}
            >
              {skill}
            </Chip>
          ))}
          {!showAll && hiddenCount > 0 && (
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center rounded-full bg-[var(--color-bg-tertiary)] px-3 py-1 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              +{hiddenCount} more
            </button>
          )}
        </div>
      )}

      {isAdding && (
        <div className="mt-3 flex items-center gap-2">
          <Input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddSkill() }}
            placeholder="Add a skill..."
            className="text-sm"
          />
          <button
            onClick={handleAddSkill}
            disabled={!newSkill.trim()}
            className="text-sm font-medium text-primary-500 hover:text-primary-600 disabled:opacity-50 shrink-0"
          >
            Add
          </button>
        </div>
      )}
    </div>
  )
}
