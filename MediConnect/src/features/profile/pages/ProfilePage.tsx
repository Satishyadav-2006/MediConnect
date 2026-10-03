import { useState, useMemo, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMapPin, FiCalendar, FiEdit2, FiMoreHorizontal, FiShare2, FiFlag, FiUserX, FiUserPlus, FiCheck, FiImage, FiUsers, FiLink2, FiEye, FiTrendingUp, FiArrowLeft, FiCalendar as FiEvent } from 'react-icons/fi'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useProfile, useUploadPhoto, useUploadBanner } from '@/features/profile/hooks/useProfile'
import { useAuth } from '@/contexts/AuthContext'
import { connectionService } from '@/api/connectionService'
import { messageService } from '@/api/messageService'
import { postService } from '@/api/postService'
import { showSuccess, showError } from '@/components/ui/Toast'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import { extractList } from '@/lib/pagination'
import AboutCard from '@/components/profile/AboutCard'
import EducationCard from '@/components/profile/EducationCard'
import ExperienceCard from '@/components/profile/ExperienceCard'
import SkillsCard from '@/components/profile/SkillsCard'
import CertificationsCard from '@/components/profile/CertificationsCard'
import LanguagesCard from '@/components/profile/LanguagesCard'
import ProfileCompletionCard from '@/components/profile/ProfileCompletionCard'
import ResearchCard from '@/components/profile/ResearchCard'
import ActivityCard from '@/components/profile/ActivityCard'
import PostCard from '@/components/feed/PostCard'
import EventCard from '@/components/events/EventCard'
import { PostCardSkeleton, ProfileCardSkeleton } from '@/components/skeletons'
import { NoPostsEmpty } from '@/components/empty-states'
import { Tabs, TabList, TabTrigger, TabContent } from '@/components/ui/Tabs'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import Skeleton from '@/components/ui/Skeleton'
import { formatFullDate, formatNumber } from '@/utils'
import type { Post, User } from '@/types'

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser, refreshUser } = useAuth()
  const { data, isLoading, isError } = useProfile(id || '')
  const [activeTab, setActiveTab] = useState('posts')

  const profile = (data?.data?.user || data?.data || data) as User | undefined
  const { data: postsData } = useQuery({
    queryKey: ['userPosts', profile?._id],
    queryFn: () => postService.getUserPosts(profile?._id ?? '').then(r => r.data),
    enabled: !!profile?._id,
    select: (r) => extractList<Post>(r),
  })
  const userPosts = useMemo(() => postsData ?? [], [postsData])
  const isOwn = currentUser?.username === id || currentUser?._id === id

  const photoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const uploadPhoto = useUploadPhoto()
  const uploadBanner = useUploadBanner()

  const handlePhotoSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return
      if (!file.type.startsWith('image/')) {
        showError('Please select an image file')
        return
      }
      try {
        await uploadPhoto.mutateAsync(file)
        showSuccess('Profile photo updated')
        void refreshUser()
      } catch {
        showError('Failed to upload profile photo')
      }
    },
    [uploadPhoto, refreshUser]
  )

  const handleBannerSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return
      if (!file.type.startsWith('image/')) {
        showError('Please select an image file')
        return
      }
      try {
        await uploadBanner.mutateAsync(file)
        showSuccess('Cover photo updated')
        void refreshUser()
      } catch {
        showError('Failed to upload cover photo')
      }
    },
    [uploadBanner, refreshUser]
  )

  const queryClient = useQueryClient()
  const { data: connStatusData } = useQuery({
    queryKey: ['connectionStatus', profile?._id],
    queryFn: () => connectionService.getConnectionStatus(profile!._id).then(r => r.data),
    enabled: !!profile?._id && !isOwn,
  })
  const connStatus = connStatusData as { status: string; connection_id?: string } | undefined
  const refreshConnectionStatus = () => queryClient.invalidateQueries({ queryKey: ['connectionStatus', profile?._id] })

  const connectMutation = useMutation({
    mutationFn: () => connectionService.sendRequest(profile!._id),
    onSuccess: () => { showSuccess('Connection request sent'); refreshConnectionStatus(); void refreshUser() },
    onError: () => showError('Failed to send connection request'),
  })

  const acceptMutation = useMutation({
    mutationFn: () => connectionService.acceptRequest(connStatus?.connection_id ?? ''),
    onSuccess: () => { showSuccess('Connection accepted'); refreshConnectionStatus(); void refreshUser() },
    onError: () => showError('Failed to accept connection request'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => connectionService.cancelRequest(connStatus?.connection_id ?? ''),
    onSuccess: () => { showSuccess('Connection request cancelled'); refreshConnectionStatus(); void refreshUser() },
    onError: () => showError('Failed to cancel connection request'),
  })

  const messageMutation = useMutation({
    mutationFn: () => messageService.createConversation([profile!._id]),
    onSuccess: (res) => {
      const convoId = res.data?.conversation_id
      navigate(convoId ? `/messages/${convoId}` : '/messages')
    },
    onError: () => navigate('/messages'),
  })

  const researchPosts = useMemo(
    () => userPosts.filter((p) => p.type === 'research'),
    [userPosts]
  )

  const mediaImages = useMemo(
    () => userPosts.flatMap((p) => p.images || []).filter(Boolean),
    [userPosts]
  )

  const recentActivities = useMemo(
    () =>
      userPosts.slice(0, 10).map((p) => ({
        type: 'post' as const,
        description: `Published a new post`,
        timestamp: p.createdAt,
        target: { label: p.content.slice(0, 60), url: `/feed?post=${p._id}` },
      })),
    [userPosts]
  )

  const analyticsPreview = useMemo(
    () => ({
      views: Math.floor(Math.random() * 500) + 100,
      impressions: Math.floor(Math.random() * 2000) + 500,
      searchAppearances: Math.floor(Math.random() * 300) + 50,
      engagement: Math.floor(Math.random() * 40) + 5,
    }),
    []
  )

  if (isLoading) {
    return (
      <motion.div {...pageTransition} className="mx-auto max-w-4xl space-y-4 p-4">
        <ProfileCardSkeleton />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      </motion.div>
    )
  }

  if (isError || !profile) {
    return (
      <motion.div {...pageTransition} className="flex flex-col items-center justify-center py-20">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Profile not found</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">This user may have been removed or the link is incorrect.</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-5xl p-4">
      <div className="flex gap-6">
        <div className="min-w-0 flex-1 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]"
          >
            <div className="relative h-48 sm:h-52">
              {isOwn && (
                <>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerSelected}
                    className="hidden"
                    aria-hidden="true"
                  />
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelected}
                    className="hidden"
                    aria-hidden="true"
                  />
                </>
              )}
              <img
                src={profile.coverPhoto || ''}
                alt=""
                className="h-full w-full object-cover"
              />
              {!profile.coverPhoto && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-700" />
              )}
              {isOwn && (
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadBanner.isPending}
                  className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-[var(--color-bg-primary)]/80 px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)] backdrop-blur-sm transition-colors hover:bg-[var(--color-bg-primary)] disabled:opacity-60"
                >
                  <FiEdit2 size={12} /> {uploadBanner.isPending ? 'Uploading...' : 'Edit Banner'}
                </button>
              )}
            </div>

            <div className="relative px-5 pb-5 sm:px-6">
              <div className="-mt-16 flex items-end justify-between">
                <div className="relative">
                  <Avatar
                    src={profile.profilePhoto}
                    name={profile.fullName}
                    size="xl"
                    className="h-28 w-28 rounded-full border-4 border-[var(--color-bg-primary)]"
                  />
                  {isOwn && (
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploadPhoto.isPending}
                      className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-bg-primary)] shadow-md transition-colors hover:bg-[var(--color-bg-hover)] disabled:opacity-60"
                      aria-label="Change profile photo"
                    >
                      <FiEdit2 size={14} className="text-[var(--color-text-secondary)]" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 pb-1">
                  {isOwn ? (
                    <Button variant="outline" size="sm" leftIcon={<FiEdit2 size={14} />} onClick={() => navigate('/profile/edit')}>
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      {connStatus?.status === 'pending_sent' && (
                        <Button variant="outline" size="sm" onClick={() => cancelMutation.mutate()} isLoading={cancelMutation.isPending}>
                          Cancel Request
                        </Button>
                      )}
                      {connStatus?.status === 'pending_received' && (
                        <Button size="sm" leftIcon={<FiCheck size={14} />} onClick={() => acceptMutation.mutate()} isLoading={acceptMutation.isPending}>
                          Accept Request
                        </Button>
                      )}
                      {connStatus?.status === 'accepted' && (
                        <Button size="sm" leftIcon={<FiCheck size={14} />} disabled>
                          Connected
                        </Button>
                      )}
                      {(!connStatus || connStatus.status === 'none') && (
                        <Button size="sm" leftIcon={<FiUserPlus size={14} />} onClick={() => connectMutation.mutate()} isLoading={connectMutation.isPending}>
                          Connect
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => messageMutation.mutate()} isLoading={messageMutation.isPending}>
                        Message
                      </Button>
                    </>
                  )}
                  {!isOwn && (
                    <Dropdown
                      trigger={
                        <Button variant="ghost" size="sm">
                          <FiMoreHorizontal size={16} />
                        </Button>
                      }
                      items={[
                        { label: 'Share Profile', icon: <FiShare2 size={14} />, onClick: () => {} },
                        { label: 'Report User', icon: <FiFlag size={14} />, onClick: () => {}, danger: true },
                        { label: 'Block User', icon: <FiUserX size={14} />, onClick: () => {}, danger: true },
                      ]}
                    />
                  )}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{profile.fullName}</h1>
                  {profile.accountStatus === 'active' && (
                    <Badge variant="primary" dot>Verified</Badge>
                  )}
                </div>

                {profile.headline && (
                  <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{profile.headline}</p>
                )}

                {profile.currentOrganization && (
                  <Link
                    to={`/organizations/${typeof profile.currentOrganization === 'string'
                      ? profile.organizationId
                      : profile.currentOrganization.organization_id}`}
                    className="mt-3 inline-flex items-center gap-2.5 rounded-lg border border-primary-500/30 bg-primary-50 px-3 py-2 transition-colors hover:border-primary-500/60 hover:bg-primary-100"
                  >
                    {typeof profile.currentOrganization !== 'string' && profile.currentOrganization.logo ? (
                      <img
                        src={profile.currentOrganization.logo}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white">
                        <FiUsers size={16} />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block text-[11px] font-medium uppercase tracking-wide text-primary-700">
                        Employee
                      </span>
                      <span className="block truncate text-sm font-semibold text-primary-800">
                        {typeof profile.currentOrganization === 'string'
                          ? profile.currentOrganization
                          : profile.currentOrganization?.name || ''}
                        {profile.designation && (
                          <span className="font-normal text-primary-700"> &middot; {profile.designation}</span>
                        )}
                      </span>
                    </span>
                  </Link>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)]">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <FiMapPin size={12} /> {profile.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <FiCalendar size={12} /> Joined {formatFullDate(profile.createdAt)}
                  </span>
                  {profile.currentOrganization && (
                    <span className="flex items-center gap-1">
                      <FiLink2 size={12} /> {typeof profile.currentOrganization === 'string'
                        ? profile.currentOrganization
                        : profile.currentOrganization.name}
                    </span>
                  )}
                </div>

                {profile.bio && (
                  <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{profile.bio}</p>
                )}

                <div className="mt-4 flex items-center gap-6 border-t border-[var(--color-border-primary)] pt-4">
                  {[
                    { label: 'Connections', count: profile.connectionsCount },
                    { label: 'Followers', count: profile.followersCount },
                    { label: 'Following', count: profile.followingCount },
                    { label: 'Posts', count: profile.postsCount },
                  ].map((stat) => (
                    <button key={stat.label} className="text-left transition-colors hover:text-primary-500">
                      <p className="text-base font-bold text-[var(--color-text-primary)]">{formatNumber(stat.count)}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{stat.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <Tabs defaultValue="posts" onValueChange={setActiveTab}>
            <TabList>
              <TabTrigger value="posts">Posts</TabTrigger>
              <TabTrigger value="about">About</TabTrigger>
              <TabTrigger value="research">Research</TabTrigger>
              <TabTrigger value="media">Media</TabTrigger>
              <TabTrigger value="events">Events</TabTrigger>
              <TabTrigger value="activity">Activity</TabTrigger>
              <TabTrigger value="analytics">Analytics</TabTrigger>
            </TabList>

            <TabContent value="posts">
              {userPosts.length === 0 ? (
                <NoPostsEmpty />
              ) : (
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
                  {userPosts.map((post) => (
                    <motion.div key={post._id} variants={staggerItem}>
                      <PostCard post={post} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabContent>

            <TabContent value="about">
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
                <motion.div variants={staggerItem}>
                  <AboutCard user={profile} isOwnProfile={isOwn} />
                </motion.div>

                <motion.div variants={staggerItem} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Experience</h3>
                    {isOwn && (
                      <button className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-primary-500 transition-colors">
                        <FiEdit2 size={16} />
                      </button>
                    )}
                  </div>
                  {profile.experience.length === 0 ? (
                    <p className="mt-3 text-sm text-[var(--color-text-muted)]">No experience listed.</p>
                  ) : (
                    <div className="mt-2 divide-y divide-[var(--color-border-primary)]">
                      {profile.experience.map((exp) => (
                        <ExperienceCard key={exp._id} experience={exp} isOwnProfile={isOwn} />
                      ))}
                    </div>
                  )}
                </motion.div>

                <motion.div variants={staggerItem} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Education</h3>
                    {isOwn && (
                      <button className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-primary-500 transition-colors">
                        <FiEdit2 size={16} />
                      </button>
                    )}
                  </div>
                  {profile.education.length === 0 ? (
                    <p className="mt-3 text-sm text-[var(--color-text-muted)]">No education listed.</p>
                  ) : (
                    <div className="mt-2 divide-y divide-[var(--color-border-primary)]">
                      {profile.education.map((edu) => (
                        <EducationCard key={edu._id} education={edu} isOwnProfile={isOwn} />
                      ))}
                    </div>
                  )}
                </motion.div>

                <motion.div variants={staggerItem}>
                  <SkillsCard user={profile} isOwnProfile={isOwn} />
                </motion.div>

                <motion.div variants={staggerItem}>
                  <CertificationsCard
                    certifications={profile.certifications}
                    isOwnProfile={isOwn}
                  />
                </motion.div>

                <motion.div variants={staggerItem}>
                  <LanguagesCard
                    languages={profile.languages}
                    isOwnProfile={isOwn}
                  />
                </motion.div>
              </motion.div>
            </TabContent>

            <TabContent value="research">
              {researchPosts.length === 0 ? (
                <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-8 text-center">
                  <p className="text-sm text-[var(--color-text-muted)]">No research publications yet.</p>
                </div>
              ) : (
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
                  {researchPosts.map((post) => (
                    <motion.div key={post._id} variants={staggerItem}>
                      <ResearchCard post={post} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabContent>

            <TabContent value="media">
              {mediaImages.length === 0 ? (
                <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-8 text-center">
                  <FiImage size={32} className="mx-auto text-[var(--color-text-muted)]" />
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">No media posted yet.</p>
                </div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                >
                  {mediaImages.map((img, idx) => (
                    <motion.div
                      key={idx}
                      variants={staggerItem}
                      className="group relative aspect-square overflow-hidden rounded-lg"
                    >
                      <img
                        src={img}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabContent>

            <TabContent value="events">
              <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-8 text-center">
                <FiCalendar size={32} className="mx-auto text-[var(--color-text-muted)]" />
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">No events registered or hosted yet.</p>
              </div>
            </TabContent>

            <TabContent value="activity">
              {recentActivities.length === 0 ? (
                <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-8 text-center">
                  <p className="text-sm text-[var(--color-text-muted)]">No recent activity.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
                  <div className="divide-y divide-[var(--color-border-primary)]">
                    {recentActivities.map((activity, idx) => (
                      <ActivityCard key={idx} activity={activity} />
                    ))}
                  </div>
                </div>
              )}
            </TabContent>

            <TabContent value="analytics">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: 'Profile Views', value: analyticsPreview.views, icon: FiEye, color: 'text-blue-500 bg-blue-50' },
                    { label: 'Post Impressions', value: analyticsPreview.impressions, icon: FiTrendingUp, color: 'text-green-500 bg-green-50' },
                    { label: 'Search Appearances', value: analyticsPreview.searchAppearances, icon: FiUsers, color: 'text-purple-500 bg-purple-50' },
                    { label: 'Engagement Rate', value: `${analyticsPreview.engagement}%`, icon: FiTrendingUp, color: 'text-orange-500 bg-orange-50' },
                  ].map((stat) => (
                    <motion.div
                      key={stat.label}
                      variants={staggerItem}
                      className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4"
                    >
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
                        <stat.icon size={18} />
                      </div>
                      <p className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">
                        {typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
                <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Engagement over time</h3>
                  <div className="mt-4 flex h-40 items-end gap-1">
                    {Array.from({ length: 14 }).map((_, i) => {
                      const h = Math.random() * 100
                      return (
                        <div
                          key={i}
                          className="flex-1 rounded-t bg-primary-500/20 transition-all hover:bg-primary-500/40"
                          style={{ height: `${Math.max(h, 8)}%` }}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            </TabContent>
          </Tabs>
        </div>

        <div className="hidden w-72 shrink-0 space-y-4 lg:block">
          {isOwn && (
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <ProfileCompletionCard user={profile} />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5"
          >
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Suggested Connections</h3>
            <div className="mt-3 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="mb-1 h-3 w-24" />
                    <Skeleton className="h-2.5 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5"
          >
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Similar Profiles</h3>
            <div className="mt-3 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="mb-1 h-3 w-24" />
                    <Skeleton className="h-2.5 w-28" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
