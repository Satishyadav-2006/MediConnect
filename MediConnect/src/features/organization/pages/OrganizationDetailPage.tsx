import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useOrganization, useOrganizationPosts, useOrganizationJobs, useOrganizationInternships, useOrganizationEvents, useOrganizationEmployees, useOrganizationGallery, useUploadGalleryItem } from '@/features/organization/hooks/useOrganization'
import { useAuth } from '@/contexts/AuthContext'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import OrganizationHeader from '@/components/organization/OrganizationHeader'
import OrganizationSidebar from '@/features/organization/components/OrganizationSidebar'
import PostCard from '@/components/feed/PostCard'
import PostComposer from '@/components/feed/PostComposer'
import JobCard from '@/components/jobs/JobCard'
import EventCard from '@/components/events/EventCard'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { extractList } from '@/lib/pagination'
import Avatar from '@/components/ui/Avatar'
import Skeleton from '@/components/ui/Skeleton'
import { PostCardSkeleton, JobCardSkeleton, EventCardSkeleton } from '@/components/skeletons'
import { NoPostsEmpty, NoJobsEmpty, NoEventsEmpty } from '@/components/empty-states'
import { FiUpload, FiImage, FiUsers, FiBarChart2, FiSearch, FiX } from 'react-icons/fi'
import { formatNumber } from '@/utils'
import type { OrganizationTab } from '@/features/organization/types'
import type { Organization, Post, Job, Internship, Event } from '@/types'

export default function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<OrganizationTab>('about')

  const { data: orgData, isLoading, isError } = useOrganization(id || '')
  const organization = (orgData?.data || orgData) as Organization | undefined

  const isOwner = user && organization && (
    user._id === (organization as unknown as Record<string, unknown>).owner ||
    user._id === (organization as unknown as Record<string, unknown>).owner_id ||
    user.role === 'admin' || user.role === 'super_admin'
  )

  if (isLoading) {
    return (
      <motion.div {...pageTransition} className="space-y-4">
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] overflow-hidden">
          <Skeleton className="h-48 w-full rounded-none" />
          <div className="px-6 pb-4">
            <div className="flex items-end gap-4 -mt-8">
              <Skeleton className="h-20 w-20 rounded-xl" />
              <div className="pb-1">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-10 w-full mt-4" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map(i => <PostCardSkeleton key={i} />)}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </motion.div>
    )
  }

  if (isError || !organization) {
    return (
      <motion.div {...pageTransition} className="flex flex-col items-center justify-center py-20">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Organization not found</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">This organization may have been removed or the link is incorrect.</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <OrganizationHeader
        organization={organization}
        isOwner={!!isOwner}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TabContent org={organization} activeTab={activeTab} isOwner={!!isOwner} />
        </div>
        <div>
          <OrganizationSidebar
            organization={organization}
            upcomingEvents={[]}
            recentEmployees={[]}
          />
        </div>
      </div>
    </motion.div>
  )
}

function TabContent({ org, activeTab, isOwner }: { org: Organization; activeTab: OrganizationTab; isOwner: boolean }) {
  switch (activeTab) {
    case 'about':
      return <AboutTab organization={org} />
    case 'posts':
      return <PostsTab orgId={org._id} isOwner={isOwner} />
    case 'jobs':
      return <JobsTab orgId={org._id} isOwner={isOwner} />
    case 'internships':
      return <InternshipsTab orgId={org._id} isOwner={isOwner} />
    case 'events':
      return <EventsTab orgId={org._id} isOwner={isOwner} />
    case 'gallery':
      return <GalleryTab orgId={org._id} isOwner={isOwner} />
    case 'employees':
      return <EmployeesTab orgId={org._id} />
    case 'analytics':
      return <AnalyticsTab orgId={org._id} isOwner={isOwner} org={org} />
    default:
      return <AboutTab organization={org} />
  }
}

function AboutTab({ organization }: { organization: Organization }) {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
      <motion.div variants={staggerItem} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">About</h3>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">
          {organization.description || 'No description provided.'}
        </p>
      </motion.div>

      <motion.div variants={staggerItem} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Contact Information</h3>
        <div className="mt-3 space-y-2 text-sm text-[var(--color-text-secondary)]">
          {organization.email && <div>Email: {organization.email}</div>}
          {organization.phone && <div>Phone: {organization.phone}</div>}
          {organization.location && <div>Location: {organization.location}</div>}
          {organization.website && (
            <div>Website: <a href={organization.website} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-600">{organization.website}</a></div>
          )}
        </div>
      </motion.div>

      {organization.specializations?.length > 0 && (
        <motion.div variants={staggerItem} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Specializations</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {organization.specializations.map(s => (
              <Badge key={s} variant="primary" size="sm">{s}</Badge>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div variants={staggerItem} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Overview</h3>
        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[var(--color-text-muted)]">Type</p>
            <p className="font-medium text-[var(--color-text-primary)] capitalize">{organization.type.replace('_', ' ')}</p>
          </div>
          {organization.foundedYear && (
            <div>
              <p className="text-[var(--color-text-muted)]">Founded</p>
              <p className="font-medium text-[var(--color-text-primary)]">{organization.foundedYear}</p>
            </div>
          )}
          <div>
            <p className="text-[var(--color-text-muted)]">Employees</p>
            <p className="font-medium text-[var(--color-text-primary)]">{organization.employeesCount}</p>
          </div>
          <div>
            <p className="text-[var(--color-text-muted)]">Followers</p>
            <p className="font-medium text-[var(--color-text-primary)]">{organization.followersCount}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function PostsTab({ orgId, isOwner }: { orgId: string; isOwner: boolean }) {
  const { data, isLoading, fetchNextPage, hasNextPage } = useOrganizationPosts(orgId)
  const posts = useMemo(() => data?.pages?.flatMap(p => extractList<Post>(p)) || [], [data])

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
          <PostComposer />
        </div>
      )}
      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <PostCardSkeleton key={i} />)}</div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-8">
          <NoPostsEmpty />
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
          {posts.map((post: Post) => (
            <motion.div key={post._id} variants={staggerItem}>
              <PostCard post={post} />
            </motion.div>
          ))}
        </motion.div>
      )}
      {hasNextPage && (
        <div className="flex justify-center py-4">
          <Button variant="outline" onClick={() => fetchNextPage()}>Load More</Button>
        </div>
      )}
    </div>
  )
}

function JobsTab({ orgId, isOwner }: { orgId: string; isOwner: boolean }) {
  const { data, isLoading, fetchNextPage, hasNextPage } = useOrganizationJobs(orgId)
  const jobs = useMemo(() => data?.pages?.flatMap(p => extractList<Job>(p)) || [], [data])

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex justify-end">
          <Link to={`/jobs/create?org=${orgId}`}>
            <Button leftIcon={<FiUpload size={14} />}>Create Job</Button>
          </Link>
        </div>
      )}
      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <JobCardSkeleton key={i} />)}</div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-8">
          <NoJobsEmpty />
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
          {jobs.map((job: Job) => (
            <motion.div key={job._id} variants={staggerItem}>
              <JobCard job={job} />
            </motion.div>
          ))}
        </motion.div>
      )}
      {hasNextPage && (
        <div className="flex justify-center py-4">
          <Button variant="outline" onClick={() => fetchNextPage()}>Load More</Button>
        </div>
      )}
    </div>
  )
}

function InternshipsTab({ orgId, isOwner }: { orgId: string; isOwner: boolean }) {
  const { data, isLoading, fetchNextPage, hasNextPage } = useOrganizationInternships(orgId)
  const internships = useMemo(() => data?.pages?.flatMap(p => extractList<Internship>(p)) || [], [data])

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex justify-end">
          <Link to={`/internships/create?org=${orgId}`}>
            <Button leftIcon={<FiUpload size={14} />}>Create Internship</Button>
          </Link>
        </div>
      )}
      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <JobCardSkeleton key={i} />)}</div>
      ) : internships.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-8">
          <NoJobsEmpty />
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
          {internships.map((internship: any) => (
            <motion.div key={internship._id} variants={staggerItem}>
              <JobCard job={internship} />
            </motion.div>
          ))}
        </motion.div>
      )}
      {hasNextPage && (
        <div className="flex justify-center py-4">
          <Button variant="outline" onClick={() => fetchNextPage()}>Load More</Button>
        </div>
      )}
    </div>
  )
}

function EventsTab({ orgId, isOwner }: { orgId: string; isOwner: boolean }) {
  const { data, isLoading, fetchNextPage, hasNextPage } = useOrganizationEvents(orgId)
  const events = useMemo(() => data?.pages?.flatMap(p => extractList<Event>(p)) || [], [data])

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex justify-end">
          <Link to="/events/create">
            <Button leftIcon={<FiUpload size={14} />}>Create Event</Button>
          </Link>
        </div>
      )}
      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <EventCardSkeleton key={i} />)}</div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-8">
          <NoEventsEmpty />
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
          {events.map((event: Event) => (
            <motion.div key={event._id} variants={staggerItem}>
              <EventCard event={event} />
            </motion.div>
          ))}
        </motion.div>
      )}
      {hasNextPage && (
        <div className="flex justify-center py-4">
          <Button variant="outline" onClick={() => fetchNextPage()}>Load More</Button>
        </div>
      )}
    </div>
  )
}

function GalleryTab({ orgId, isOwner }: { orgId: string; isOwner: boolean }) {
  const { data, isLoading, fetchNextPage, hasNextPage } = useOrganizationGallery(orgId)
  const uploadGallery = useUploadGalleryItem(orgId)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  type GalleryItem = { url?: string; category?: string; [key: string]: unknown }
  const gallery = useMemo(() => data?.pages?.flatMap(p => extractList<GalleryItem>(p)) || [], [data])
  const categories = useMemo(() => ['all', ...new Set(gallery.map(item => item.category || 'general'))], [gallery])
  const filtered = categoryFilter === 'all' ? gallery : gallery.filter(item => (item.category || 'general') === categoryFilter)

  const handleUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) uploadGallery.mutate({ file, type: 'image' })
    }
    input.click()
  }

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex justify-end">
          <Button leftIcon={<FiUpload size={14} />} onClick={handleUpload} isLoading={uploadGallery.isPending}>Upload Photo</Button>
        </div>
      )}

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${categoryFilter === cat ? 'bg-primary-500 text-white' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'}`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="aspect-square rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-12 text-center">
          <FiImage size={48} className="mx-auto text-[var(--color-text-muted)]" />
          <h3 className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">No gallery items yet</h3>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Photos and media will appear here.</p>
          {isOwner && <Button className="mt-4" onClick={handleUpload}>Upload First Photo</Button>}
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((item: any, idx: number) => (
            <motion.div
              key={item._id || idx}
              variants={staggerItem}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl"
              onClick={() => setSelectedImage(item.url || item.file)}
            >
              <img
                src={item.url || item.file}
                alt={item.caption || ''}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
            </motion.div>
          ))}
        </motion.div>
      )}

      {hasNextPage && (
        <div className="flex justify-center py-4">
          <Button variant="outline" onClick={() => fetchNextPage()}>Load More</Button>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg">
              <FiX size={16} />
            </button>
            <img src={selectedImage} alt="" className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain" />
          </div>
        </div>
      )}
    </div>
  )
}

function EmployeesTab({ orgId }: { orgId: string }) {
  const { data, isLoading, fetchNextPage, hasNextPage } = useOrganizationEmployees(orgId)
  const [search, setSearch] = useState('')

  type EmployeeItem = { full_name?: string; designation?: string; department?: string; role?: string; [key: string]: unknown }
  const employees = useMemo(() => data?.pages?.flatMap(p => extractList<EmployeeItem>(p)) || [], [data])
  const q = search.toLowerCase()
  const filtered = search
    ? employees.filter((e: EmployeeItem) =>
        e.full_name?.toLowerCase().includes(q) ||
        e.designation?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q) ||
        e.role?.toLowerCase().includes(q)
      )
    : employees

  return (
    <div className="space-y-4">
      <div className="relative">
        <FiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search employees..."
          className="w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] pl-10 pr-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-12 text-center">
          <FiUsers size={48} className="mx-auto text-[var(--color-text-muted)]" />
          <h3 className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">No employees listed</h3>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Employee information will appear here.</p>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
          {filtered.map((employee: any, idx: number) => (
            <motion.div key={employee.user_id || idx} variants={staggerItem} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4 transition-colors hover:border-primary-500/40">
              <Link
                to={`/profile/${employee.user_id}`}
                className="flex items-center gap-3"
              >
                <Avatar name={employee.full_name || 'Employee'} src={employee.profile_photo} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate hover:text-primary-600">
                    {employee.full_name || 'Unknown'}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {employee.designation || 'Team Member'}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {employee.department && (
                      <Badge variant="default" size="sm">{employee.department}</Badge>
                    )}
                    {employee.role && employee.role !== 'employee' && (
                      <Badge variant="info" size="sm" className="uppercase">{employee.role}</Badge>
                    )}
                    {employee.status && employee.status !== 'active' && (
                      <Badge variant="warning" size="sm" className="uppercase">{employee.status}</Badge>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {hasNextPage && (
        <div className="flex justify-center py-4">
          <Button variant="outline" onClick={() => fetchNextPage()}>Load More</Button>
        </div>
      )}
    </div>
  )
}

function AnalyticsTab({ orgId, isOwner, org }: { orgId: string; isOwner: boolean; org: Organization }) {
  if (!isOwner) {
    return (
      <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">Only organization admins can view analytics.</p>
      </div>
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
      <motion.div variants={staggerItem} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Followers', value: org.followersCount || 0, color: 'text-blue-500 bg-blue-50' },
          { label: 'Jobs', value: (org as any).jobsCount || 0, color: 'text-primary-500 bg-primary-50' },
          { label: 'Events', value: (org as any).eventsCount || 0, color: 'text-accent-500 bg-accent-50' },
          { label: 'Posts', value: (org as any).postsCount || 0, color: 'text-purple-500 bg-purple-50' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
              <FiBarChart2 size={18} />
            </div>
            <p className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">{formatNumber(stat.value)}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.div variants={staggerItem} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Growth Overview</h3>
        <div className="flex h-48 items-end gap-2">
          {Array.from({ length: 12 }).map((_, i) => {
            const h = 20 + Math.random() * 80
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-primary-500/20 transition-all hover:bg-primary-500/40"
                  style={{ height: `${Math.max(h, 8)}%` }}
                />
                <span className="text-[10px] text-[var(--color-text-muted)]">{months[i]}</span>
              </div>
            )
          })}
        </div>
      </motion.div>

      <motion.div variants={staggerItem} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Growth Metrics</h3>
        <div className="space-y-3">
          {[
            { label: 'Follower growth this month', value: '+12%', positive: true },
            { label: 'Post engagement rate', value: '8.3%', positive: true },
            { label: 'Job application rate', value: '24 applications', positive: true },
            { label: 'Event attendance rate', value: '78%', positive: true },
          ].map((metric) => (
            <div key={metric.label} className="flex items-center justify-between py-2 border-b border-[var(--color-border-primary)] last:border-0">
              <span className="text-sm text-[var(--color-text-secondary)]">{metric.label}</span>
              <span className={`text-sm font-medium ${metric.positive ? 'text-accent-500' : 'text-danger-500'}`}>{metric.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
