import { useState } from 'react'
import { FiEdit2, FiPlus } from 'react-icons/fi'
import type { User } from '@/types'
import Chip from '@/components/ui/Chip'
import Input from '@/components/ui/Input'

interface LanguagesCardProps {
  languages: string[]
  isOwnProfile?: boolean
  onUpdateLanguages?: (languages: string[]) => void
}

export default function LanguagesCard({ languages, isOwnProfile, onUpdateLanguages }: LanguagesCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [newLang, setNewLang] = useState('')

  const handleAdd = () => {
    const lang = newLang.trim()
    if (lang && !languages.includes(lang)) {
      onUpdateLanguages?.([...languages, lang])
      setNewLang('')
    }
  }

  const handleRemove = (lang: string) => {
    onUpdateLanguages?.(languages.filter(l => l !== lang))
  }

  return (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Languages</h3>
        {isOwnProfile && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-primary-500 transition-colors"
          >
            {isEditing ? <FiPlus size={16} /> : <FiEdit2 size={16} />}
          </button>
        )}
      </div>

      {languages.length === 0 && !isEditing ? (
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">No languages added yet.</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {languages.map(lang => (
            <Chip
              key={lang}
              removable={isEditing}
              onRemove={() => handleRemove(lang)}
            >
              {lang}
            </Chip>
          ))}
        </div>
      )}

      {isEditing && (
        <div className="mt-3 flex items-center gap-2">
          <Input
            value={newLang}
            onChange={(e) => setNewLang(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
            placeholder="Add a language..."
            className="text-sm"
          />
          <button
            onClick={handleAdd}
            disabled={!newLang.trim()}
            className="text-sm font-medium text-primary-500 hover:text-primary-600 disabled:opacity-50 shrink-0"
          >
            Add
          </button>
        </div>
      )}
    </div>
  )
}
