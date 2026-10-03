import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiMapPin, FiUsers, FiBriefcase } from 'react-icons/fi'
import { formatNumber } from '@/utils'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import type { Organization } from '@/types'

interface OrganizationCardProps {
  organization: Organization
  isFollowing?: boolean
  onFollow?: () => void
}

const typeVariants: Record<string, 'primary' | 'info' | 'success' | 'warning'> = {
  hospital: 'primary',
  clinic: 'info',
  nursing_home: 'success',
  diagnostic_center: 'warning',
  pharmacy: 'primary',
  other: 'info',
}

export default function OrganizationCard({ organization, isFollowing = false, onFollow }: OrganizationCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="h-24 bg-gradient-to-br from-primary-500 to-primary-700 relative">
        {organization.coverPhoto && (
          <img src={organization.coverPhoto} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="px-4 pb-4">
        <div className="-mt-6 mb-2">
          <Link to={`/organizations/${organization.slug || organization._id}`}>
            {organization.logo ? (
              <img src={organization.logo} alt="" className="h-14 w-14 rounded-xl border-2 border-[var(--color-bg-primary)] object-cover shadow-sm" />
            ) : (
              <div className="h-14 w-14 rounded-xl border-2 border-[var(--color-bg-primary)] bg-primary-500 flex items-center justify-center shadow-sm">
                <span className="text-lg font-bold text-white">{organization.name[0]}</span>
              </div>
            )}
          </Link>
        </div>
        <Link to={`/organizations/${organization.slug || organization._id}`} className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-primary-500 truncate">
            {organization.name}
          </h3>
          {organization.isVerified && (
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-500 text-[8px] text-white">✓</span>
          )}
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant={typeVariants[organization.type] || 'default'} size="sm">
            {organization.type.replace('_', ' ')}
          </Badge>
        </div>
        <div className="mt-2 space-y-1 text-xs text-[var(--color-text-muted)]">
          {organization.location && (
            <div className="flex items-center gap-1"><FiMapPin size={12} />{organization.location}</div>
          )}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><FiUsers size={12} />{formatNumber(organization.followersCount)} followers</span>
            <span className="flex items-center gap-1"><FiBriefcase size={12} />{formatNumber(organization.employeesCount)} employees</span>
          </div>
        </div>
        {onFollow && (
          <div className="mt-3">
            <Button
              variant={isFollowing ? 'outline' : 'primary'}
              size="sm"
              fullWidth
              onClick={(e) => { e.preventDefault(); onFollow() }}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
