import { Link } from 'react-router-dom'
import { FiMapPin, FiGlobe, FiUsers, FiBriefcase, FiEdit2, FiShare2, FiMessageCircle } from 'react-icons/fi'
import { formatNumber } from '@/utils'
import { useFollowOrganization } from '@/features/organization/hooks/useOrganization'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Tabs, TabList, TabTrigger } from '@/components/ui/Tabs'
import type { Organization } from '@/types'
import type { OrganizationTab } from '@/features/organization/types'

interface OrganizationHeaderProps {
  organization: Organization
  isOwner?: boolean
  isFollowing?: boolean
  activeTab: OrganizationTab
  onTabChange: (tab: OrganizationTab) => void
}

const typeLabels: Record<string, string> = {
  hospital: 'Hospital',
  clinic: 'Clinic',
  nursing_home: 'Nursing Home',
  diagnostic_center: 'Diagnostic Center',
  pharmacy: 'Pharmacy',
  other: 'Other',
}

const TAB_ITEMS: { value: OrganizationTab; label: string }[] = [
  { value: 'about', label: 'About' },
  { value: 'posts', label: 'Posts' },
  { value: 'jobs', label: 'Jobs' },
  { value: 'internships', label: 'Internships' },
  { value: 'events', label: 'Events' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'employees', label: 'Employees' },
  { value: 'analytics', label: 'Analytics' },
]

export default function OrganizationHeader({ organization, isOwner, isFollowing = false, activeTab, onTabChange }: OrganizationHeaderProps) {
  const followMutation = useFollowOrganization(organization._id)

  const handleFollow = () => {
    followMutation.mutate({ isFollowing })
  }

  return (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] overflow-hidden">
      <div className="relative h-48 bg-gradient-to-br from-primary-500 to-primary-700">
        {organization.coverPhoto && (
          <img src={organization.coverPhoto} alt="" className="h-full w-full object-cover" />
        )}
        {isOwner && (
          <Link
            to={`/organizations/${organization._id}/edit`}
            className="absolute top-3 right-3 rounded-lg bg-black/40 p-2 text-white hover:bg-black/60 transition-colors"
          >
            <FiEdit2 size={16} />
          </Link>
        )}
      </div>
      <div className="px-6 pb-4">
        <div className="flex items-end gap-4 -mt-8">
          <div className="relative">
            {organization.logo ? (
              <img src={organization.logo} alt="" className="h-20 w-20 rounded-xl border-3 border-[var(--color-bg-primary)] object-cover shadow-md" />
            ) : (
              <div className="h-20 w-20 rounded-xl border-3 border-[var(--color-bg-primary)] bg-primary-500 flex items-center justify-center shadow-md">
                <span className="text-2xl font-bold text-white">{organization.name[0]}</span>
              </div>
            )}
            {isOwner && (
              <Link
                to={`/organizations/${organization._id}/edit`}
                className="absolute bottom-0 right-0 rounded-full bg-[var(--color-bg-primary)] p-1.5 shadow-md hover:bg-[var(--color-bg-hover)]"
              >
                <FiEdit2 size={12} className="text-[var(--color-text-secondary)]" />
              </Link>
            )}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[var(--color-text-primary)] truncate">{organization.name}</h1>
              {organization.isVerified && (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500 text-[10px] text-white">✓</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="primary" size="sm">{typeLabels[organization.type]}</Badge>
              {organization.specializations?.slice(0, 2).map(s => (
                <Badge key={s} variant="default" size="sm">{s}</Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[var(--color-text-secondary)]">
          {organization.location && (
            <span className="flex items-center gap-1"><FiMapPin size={14} />{organization.location}</span>
          )}
          {organization.website && (
            <a href={organization.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-500 hover:text-primary-600">
              <FiGlobe size={14} />Website
            </a>
          )}
          <span className="flex items-center gap-1"><FiUsers size={14} />{formatNumber(organization.followersCount)} followers</span>
          <span className="flex items-center gap-1"><FiBriefcase size={14} />{formatNumber(organization.employeesCount)} employees</span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          {!isOwner ? (
            <Button
              variant={isFollowing ? 'outline' : 'primary'}
              size="sm"
              onClick={handleFollow}
              isLoading={followMutation.isPending}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          ) : (
            <Link to={`/organizations/${organization._id}/edit`}>
              <Button variant="outline" size="sm" leftIcon={<FiEdit2 size={14} />}>Edit Organization</Button>
            </Link>
          )}
          <Button variant="outline" size="sm" leftIcon={<FiMessageCircle size={14} />}>Message</Button>
          <Button variant="ghost" size="sm" leftIcon={<FiShare2 size={14} />}>Share</Button>
        </div>

        <div className="mt-4">
          <Tabs defaultValue={activeTab}>
            <TabList>
              {TAB_ITEMS.map(tab => (
                <TabTrigger key={tab.value} value={tab.value} onClick={() => onTabChange(tab.value)}>
                  {tab.label}
                </TabTrigger>
              ))}
            </TabList>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
