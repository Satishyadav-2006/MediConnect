import { Suspense, lazy } from 'react'
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import PublicLayout from '@/components/layout/PublicLayout'
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout'
import AdminLayout from '@/components/layout/AdminLayout'
import OrganizationLayout from '@/components/layout/OrganizationLayout'
import ProtectedRoute from '@/routes/ProtectedRoute'
import GuestRoute from '@/routes/GuestRoute'
import { ROLES } from '@/constants'
import type { UserRole } from '@/types'

const RECRUITING_ROLES = [...ROLES.RECRUITING] as UserRole[]
const ORG_ROLES = [...ROLES.ORGANIZATION] as UserRole[]

const LandingPage = lazy(() => import('@/features/auth/pages/LandingPage'))
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const RegisterMultiStepPage = lazy(() => import('@/features/auth/pages/RegisterMultiStepPage'))
const OTPVerificationPage = lazy(() => import('@/features/auth/pages/OTPVerificationPage'))
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'))
const VerifyEmailPage = lazy(() => import('@/features/auth/pages/VerifyEmailPage'))
const PrivacyPolicyPage = lazy(() => import('@/features/public/pages/PrivacyPolicyPage'))
const TermsPage = lazy(() => import('@/features/public/pages/TermsPage'))
const ContactUsPage = lazy(() => import('@/features/public/pages/ContactUsPage'))
const AboutUsPage = lazy(() => import('@/features/public/pages/AboutUsPage'))
const FAQPage = lazy(() => import('@/features/public/pages/FAQPage'))
const PendingVerificationPage = lazy(() => import('@/features/auth/pages/PendingVerificationPage'))
const VerificationStatusPage = lazy(() => import('@/features/auth/pages/VerificationStatusPage'))
const RejectedPage = lazy(() => import('@/features/auth/pages/RejectedPage'))
const SuspendedPage = lazy(() => import('@/features/auth/pages/SuspendedPage'))
const VerificationRequestFormPage = lazy(() => import('@/features/verification/pages/VerificationRequestPage'))

const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const FeedPage = lazy(() => import('@/features/feed/pages/FeedPage'))
const PostDetailPage = lazy(() => import('@/features/feed/pages/PostDetailPage'))
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage'))
const ProfileEditPage = lazy(() => import('@/features/profile/pages/ProfileEditPage'))
const ConnectionsPage = lazy(() => import('@/features/connections/pages/ConnectionsPage'))
const SearchPage = lazy(() => import('@/features/search/pages/SearchPage'))
const MessagesPage = lazy(() => import('@/features/messages/pages/MessagesPage'))
const OrganizationChatPage = lazy(() => import('@/features/messages/pages/OrganizationChatPage'))
const NotificationsPage = lazy(() => import('@/features/notifications/pages/NotificationsPage'))
const AnalyticsPage = lazy(() => import('@/features/analytics/pages/AnalyticsPage'))
const BookmarksPage = lazy(() => import('@/features/settings/pages/BookmarksPage'))
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'))
const SecurityPage = lazy(() => import('@/features/settings/pages/SecurityPage'))
const PrivacySettingsPage = lazy(() => import('@/features/settings/pages/PrivacySettingsPage'))
const NotificationSettingsPage = lazy(() => import('@/features/settings/pages/NotificationSettingsPage'))
const BlockedUsersPage = lazy(() => import('@/features/settings/pages/BlockedUsersPage'))
const AchievementsPage = lazy(() => import('@/features/achievements/pages/AchievementsPage'))
const AnnualSummaryPage = lazy(() => import('@/features/profile/pages/AnnualSummaryPage'))

const JobsPage = lazy(() => import('@/features/jobs/pages/JobsPage'))
const JobCreatePage = lazy(() => import('@/features/jobs/pages/JobCreatePage'))
const JobEditPage = lazy(() => import('@/features/jobs/pages/JobEditPage'))
const JobDetailPage = lazy(() => import('@/features/jobs/pages/JobDetailPage'))
const JobsSavedPage = lazy(() => import('@/features/jobs/pages/JobsSavedPage'))
const JobsAppliedPage = lazy(() => import('@/features/jobs/pages/JobsAppliedPage'))
const JobApplicantsPage = lazy(() => import('@/features/jobs/pages/JobApplicantsPage'))

const InternshipsPage = lazy(() => import('@/features/internships/pages/InternshipsPage'))
const InternshipCreatePage = lazy(() => import('@/features/internships/pages/InternshipCreatePage'))
const InternshipEditPage = lazy(() => import('@/features/internships/pages/InternshipEditPage'))
const InternshipDetailPage = lazy(() => import('@/features/internships/pages/InternshipDetailPage'))
const InternshipsSavedPage = lazy(() => import('@/features/internships/pages/InternshipsSavedPage'))
const InternshipsAppliedPage = lazy(() => import('@/features/internships/pages/InternshipsAppliedPage'))
const InternshipApplicantsPage = lazy(() => import('@/features/internships/pages/InternshipApplicantsPage'))

const EventsPage = lazy(() => import('@/features/events/pages/EventsPage'))
const EventCreatePage = lazy(() => import('@/features/events/pages/EventCreatePage'))
const EventEditPage = lazy(() => import('@/features/events/pages/EventEditPage'))
const EventDetailPage = lazy(() => import('@/features/events/pages/EventDetailPage'))
const EventsMyEventsPage = lazy(() => import('@/features/events/pages/EventsMyEventsPage'))
const EventsRegisteredPage = lazy(() => import('@/features/events/pages/EventsRegisteredPage'))
const EventRegistrantsPage = lazy(() => import('@/features/events/pages/EventRegistrantsPage'))

const MentorsPage = lazy(() => import('@/features/mentorship/pages/MentorsPage'))
const MentorDetailPage = lazy(() => import('@/features/mentorship/pages/MentorDetailPage'))
const MentorDashboardPage = lazy(() => import('@/features/mentorship/pages/MentorDashboardPage'))
const MentorRequestsPage = lazy(() => import('@/features/mentorship/pages/MentorRequestsPage'))
const MyMenteesPage = lazy(() => import('@/features/mentorship/pages/MyMenteesPage'))
const RequestMentorPage = lazy(() => import('@/features/mentorship/pages/RequestMentorPage'))

const OrganizationsPage = lazy(() => import('@/features/organization/pages/OrganizationsPage'))
const OrganizationDetailPage = lazy(() => import('@/features/organization/pages/OrganizationDetailPage'))
const OrganizationEditPage = lazy(() => import('@/features/organization/pages/OrganizationEditPage'))
const OrganizationEmployeesPage = lazy(() => import('@/features/organization/pages/OrganizationEmployeesPage'))
const OrganizationGalleryPage = lazy(() => import('@/features/organization/pages/OrganizationGalleryPage'))
const OrganizationJobsPage = lazy(() => import('@/features/organization/pages/OrganizationJobsPage'))
const OrganizationInternshipsPage = lazy(() => import('@/features/organization/pages/OrganizationInternshipsPage'))
const OrganizationPostsPage = lazy(() => import('@/features/organization/pages/OrganizationPostsPage'))
const OrganizationEventsPage = lazy(() => import('@/features/organization/pages/OrganizationEventsPage'))
const OrganizationAnalyticsPage = lazy(() => import('@/features/organization/pages/OrganizationAnalyticsPage'))

const OrgDashboardPage = lazy(() => import('@/features/organization/pages/org/OrgDashboardPage'))
const OrgCreatePage = lazy(() => import('@/features/organization/pages/org/OrgCreatePage'))
const OrgProfilePage = lazy(() => import('@/features/organization/pages/org/OrgProfilePage'))
const OrgEmployeesPage = lazy(() => import('@/features/organization/pages/org/OrgEmployeesPage'))
const OrgPostsPage = lazy(() => import('@/features/organization/pages/org/OrgPostsPage'))
const OrgEventsPage = lazy(() => import('@/features/organization/pages/org/OrgEventsPage'))
const OrgMessagesPage = lazy(() => import('@/features/organization/pages/org/OrgMessagesPage'))
const OrgNotificationsPage = lazy(() => import('@/features/organization/pages/org/OrgNotificationsPage'))
const OrgAnalyticsPage = lazy(() => import('@/features/organization/pages/org/OrgAnalyticsPage'))

const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage'))
const AdminUsersPage = lazy(() => import('@/features/admin/pages/AdminUsersPage'))
const AdminOrganizationsPage = lazy(() => import('@/features/admin/pages/AdminOrganizationsPage'))
const AdminVerificationPage = lazy(() => import('@/features/admin/pages/AdminVerificationPage'))
const AdminPostsPage = lazy(() => import('@/features/admin/pages/AdminPostsPage'))
const AdminCommentsPage = lazy(() => import('@/features/admin/pages/AdminCommentsPage'))
const AdminMessagesPage = lazy(() => import('@/features/admin/pages/AdminMessagesPage'))
const AdminJobsPage = lazy(() => import('@/features/admin/pages/AdminJobsPage'))
const AdminInternshipsPage = lazy(() => import('@/features/admin/pages/AdminInternshipsPage'))
const AdminEventsPage = lazy(() => import('@/features/admin/pages/AdminEventsPage'))
const AdminReportsPage = lazy(() => import('@/features/admin/pages/AdminReportsPage'))
const AdminAnalyticsPage = lazy(() => import('@/features/admin/pages/AdminAnalyticsPage'))
const AdminSystemPage = lazy(() => import('@/features/admin/pages/AdminSystemPage'))
const AdminSettingsPage = lazy(() => import('@/features/admin/pages/AdminSettingsPage'))
const AdminAuditLogsPage = lazy(() => import('@/features/admin/pages/AdminAuditLogsPage'))

const NotFoundPage = lazy(() => import('@/components/errors/NotFoundPage'))
const UnauthorizedPage = lazy(() => import('@/components/errors/UnauthorizedPage'))
const ForbiddenPage = lazy(() => import('@/components/errors/ForbiddenPage'))

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
  </div>
)

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
)

const publicRoutes: RouteObject[] = [
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: withSuspense(LandingPage) },
      { path: 'login', element: <GuestRoute>{withSuspense(LoginPage)}</GuestRoute> },
      { path: 'register', element: <GuestRoute>{withSuspense(RegisterMultiStepPage)}</GuestRoute> },
      { path: 'otp-verification', element: <GuestRoute>{withSuspense(OTPVerificationPage)}</GuestRoute> },
      { path: 'forgot-password', element: <GuestRoute>{withSuspense(ForgotPasswordPage)}</GuestRoute> },
      { path: 'reset-password', element: <GuestRoute>{withSuspense(ResetPasswordPage)}</GuestRoute> },
      { path: 'verify-email', element: <GuestRoute>{withSuspense(VerifyEmailPage)}</GuestRoute> },
      { path: 'privacy-policy', element: withSuspense(PrivacyPolicyPage) },
      { path: 'terms-and-conditions', element: withSuspense(TermsPage) },
      { path: 'contact-us', element: withSuspense(ContactUsPage) },
      { path: 'about-us', element: withSuspense(AboutUsPage) },
      { path: 'faq', element: withSuspense(FAQPage) },
      { path: 'pending-verification', element: <ProtectedRoute requirePendingVerification>{withSuspense(PendingVerificationPage)}</ProtectedRoute> },
      { path: 'verification-request', element: <ProtectedRoute allowPending>{withSuspense(VerificationRequestFormPage)}</ProtectedRoute> },
      { path: 'verification-status', element: <ProtectedRoute allowPending>{withSuspense(VerificationStatusPage)}</ProtectedRoute> },
      { path: 'rejected', element: <ProtectedRoute allowPending>{withSuspense(RejectedPage)}</ProtectedRoute> },
      { path: 'suspended', element: <ProtectedRoute allowPending>{withSuspense(SuspendedPage)}</ProtectedRoute> },
    ],
  },
]

const authenticatedRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AuthenticatedLayout />,
    children: [
      { path: 'dashboard', element: <ProtectedRoute requireVerified>{withSuspense(DashboardPage)}</ProtectedRoute> },
      { path: 'feed', element: <ProtectedRoute>{withSuspense(FeedPage)}</ProtectedRoute> },
      { path: 'feed/:postId', element: <ProtectedRoute>{withSuspense(PostDetailPage)}</ProtectedRoute> },
      { path: 'profile/:id', element: <ProtectedRoute>{withSuspense(ProfilePage)}</ProtectedRoute> },
      { path: 'profile/edit', element: <ProtectedRoute>{withSuspense(ProfileEditPage)}</ProtectedRoute> },
      { path: 'profile/annual-summary', element: <ProtectedRoute>{withSuspense(AnnualSummaryPage)}</ProtectedRoute> },
      { path: 'connections', element: <ProtectedRoute>{withSuspense(ConnectionsPage)}</ProtectedRoute> },
      { path: 'search', element: <ProtectedRoute>{withSuspense(SearchPage)}</ProtectedRoute> },
      { path: 'messages', element: <ProtectedRoute>{withSuspense(MessagesPage)}</ProtectedRoute> },
      { path: 'messages/:conversationId', element: <ProtectedRoute>{withSuspense(MessagesPage)}</ProtectedRoute> },
      { path: 'messages/organization/:organizationId', element: <ProtectedRoute>{withSuspense(OrganizationChatPage)}</ProtectedRoute> },
      { path: 'notifications', element: <ProtectedRoute>{withSuspense(NotificationsPage)}</ProtectedRoute> },
      { path: 'analytics', element: <ProtectedRoute>{withSuspense(AnalyticsPage)}</ProtectedRoute> },
      { path: 'bookmarks', element: <ProtectedRoute>{withSuspense(BookmarksPage)}</ProtectedRoute> },
      { path: 'achievements', element: <ProtectedRoute>{withSuspense(AchievementsPage)}</ProtectedRoute> },

      { path: 'settings', element: <ProtectedRoute>{withSuspense(SettingsPage)}</ProtectedRoute> },
      { path: 'settings/security', element: <ProtectedRoute>{withSuspense(SecurityPage)}</ProtectedRoute> },
      { path: 'settings/privacy', element: <ProtectedRoute>{withSuspense(PrivacySettingsPage)}</ProtectedRoute> },
      { path: 'settings/notifications', element: <ProtectedRoute>{withSuspense(NotificationSettingsPage)}</ProtectedRoute> },
      { path: 'settings/blocked', element: <ProtectedRoute>{withSuspense(BlockedUsersPage)}</ProtectedRoute> },

      { path: 'jobs', element: <ProtectedRoute>{withSuspense(JobsPage)}</ProtectedRoute> },
      { path: 'jobs/create', element: <ProtectedRoute requireVerified requireRole={RECRUITING_ROLES}>{withSuspense(JobCreatePage)}</ProtectedRoute> },
      { path: 'jobs/edit/:id', element: <ProtectedRoute requireVerified requireRole={RECRUITING_ROLES}>{withSuspense(JobEditPage)}</ProtectedRoute> },
      { path: 'jobs/saved', element: <ProtectedRoute>{withSuspense(JobsSavedPage)}</ProtectedRoute> },
      { path: 'jobs/applied', element: <ProtectedRoute>{withSuspense(JobsAppliedPage)}</ProtectedRoute> },
      { path: 'jobs/applicants', element: <ProtectedRoute requireRole={RECRUITING_ROLES}>{withSuspense(JobApplicantsPage)}</ProtectedRoute> },
      { path: 'jobs/:id', element: <ProtectedRoute>{withSuspense(JobDetailPage)}</ProtectedRoute> },

      { path: 'internships', element: <ProtectedRoute>{withSuspense(InternshipsPage)}</ProtectedRoute> },
      { path: 'internships/create', element: <ProtectedRoute requireVerified requireRole={RECRUITING_ROLES}>{withSuspense(InternshipCreatePage)}</ProtectedRoute> },
      { path: 'internships/edit/:id', element: <ProtectedRoute requireVerified requireRole={RECRUITING_ROLES}>{withSuspense(InternshipEditPage)}</ProtectedRoute> },
      { path: 'internships/saved', element: <ProtectedRoute>{withSuspense(InternshipsSavedPage)}</ProtectedRoute> },
      { path: 'internships/applied', element: <ProtectedRoute>{withSuspense(InternshipsAppliedPage)}</ProtectedRoute> },
      { path: 'internships/applicants', element: <ProtectedRoute requireRole={RECRUITING_ROLES}>{withSuspense(InternshipApplicantsPage)}</ProtectedRoute> },
      { path: 'internships/:id', element: <ProtectedRoute>{withSuspense(InternshipDetailPage)}</ProtectedRoute> },

      { path: 'events', element: <ProtectedRoute>{withSuspense(EventsPage)}</ProtectedRoute> },
      { path: 'events/create', element: <ProtectedRoute requireVerified>{withSuspense(EventCreatePage)}</ProtectedRoute> },
      { path: 'events/edit/:id', element: <ProtectedRoute requireVerified>{withSuspense(EventEditPage)}</ProtectedRoute> },
      { path: 'events/my-events', element: <ProtectedRoute>{withSuspense(EventsMyEventsPage)}</ProtectedRoute> },
      { path: 'events/registered', element: <ProtectedRoute>{withSuspense(EventsRegisteredPage)}</ProtectedRoute> },
      { path: 'events/registrants', element: <ProtectedRoute requireRole={RECRUITING_ROLES}>{withSuspense(EventRegistrantsPage)}</ProtectedRoute> },
      { path: 'events/:id', element: <ProtectedRoute>{withSuspense(EventDetailPage)}</ProtectedRoute> },

      { path: 'mentors', element: <ProtectedRoute>{withSuspense(MentorsPage)}</ProtectedRoute> },
      { path: 'mentors/dashboard', element: <ProtectedRoute>{withSuspense(MentorDashboardPage)}</ProtectedRoute> },
      { path: 'mentors/requests', element: <ProtectedRoute>{withSuspense(MentorRequestsPage)}</ProtectedRoute> },
      { path: 'mentors/my-mentees', element: <ProtectedRoute>{withSuspense(MyMenteesPage)}</ProtectedRoute> },
      { path: 'mentors/request/:mentorId', element: <ProtectedRoute>{withSuspense(RequestMentorPage)}</ProtectedRoute> },
      { path: 'mentors/:id', element: <ProtectedRoute>{withSuspense(MentorDetailPage)}</ProtectedRoute> },

      { path: 'organizations', element: <ProtectedRoute>{withSuspense(OrganizationsPage)}</ProtectedRoute> },
      { path: 'organizations/:id', element: <ProtectedRoute>{withSuspense(OrganizationDetailPage)}</ProtectedRoute> },
      { path: 'organizations/:id/edit', element: <ProtectedRoute>{withSuspense(OrganizationEditPage)}</ProtectedRoute> },
      { path: 'organizations/:id/employees', element: <ProtectedRoute>{withSuspense(OrganizationEmployeesPage)}</ProtectedRoute> },
      { path: 'organizations/:id/gallery', element: <ProtectedRoute>{withSuspense(OrganizationGalleryPage)}</ProtectedRoute> },
      { path: 'organizations/:id/jobs', element: <ProtectedRoute>{withSuspense(OrganizationJobsPage)}</ProtectedRoute> },
      { path: 'organizations/:id/internships', element: <ProtectedRoute>{withSuspense(OrganizationInternshipsPage)}</ProtectedRoute> },
      { path: 'organizations/:id/posts', element: <ProtectedRoute>{withSuspense(OrganizationPostsPage)}</ProtectedRoute> },
      { path: 'organizations/:id/events', element: <ProtectedRoute>{withSuspense(OrganizationEventsPage)}</ProtectedRoute> },
      { path: 'organizations/:id/analytics', element: <ProtectedRoute>{withSuspense(OrganizationAnalyticsPage)}</ProtectedRoute> },
    ],
  },
]

const orgRoutes: RouteObject[] = [
  {
    path: '/org/create',
    element: <ProtectedRoute requireVerified requireRole={ORG_ROLES}>{withSuspense(OrgCreatePage)}</ProtectedRoute>,
  },
  {
    path: '/org',
    element: <ProtectedRoute requireVerified requireRole={ORG_ROLES}><OrganizationLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: withSuspense(OrgDashboardPage) },
      { path: 'profile', element: withSuspense(OrgProfilePage) },
      { path: 'employees', element: withSuspense(OrgEmployeesPage) },
      { path: 'posts', element: withSuspense(OrgPostsPage) },
      { path: 'jobs', element: withSuspense(OrganizationJobsPage) },
      { path: 'jobs/create', element: withSuspense(JobCreatePage) },
      { path: 'jobs/:id', element: withSuspense(JobDetailPage) },
      { path: 'internships', element: withSuspense(OrganizationInternshipsPage) },
      { path: 'internships/create', element: withSuspense(InternshipCreatePage) },
      { path: 'internships/:id', element: withSuspense(InternshipDetailPage) },
      { path: 'events', element: withSuspense(OrgEventsPage) },
      { path: 'events/create', element: withSuspense(EventCreatePage) },
      { path: 'events/:id', element: withSuspense(EventDetailPage) },
      { path: 'messages', element: withSuspense(OrgMessagesPage) },
      { path: 'notifications', element: withSuspense(OrgNotificationsPage) },
      { path: 'analytics', element: withSuspense(OrgAnalyticsPage) },
      { path: 'settings', element: withSuspense(OrganizationEditPage) },
    ],
  },
]

const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <ProtectedRoute requireAdmin>{withSuspense(AdminDashboardPage)}</ProtectedRoute> },
      { path: 'users', element: <ProtectedRoute requireAdmin>{withSuspense(AdminUsersPage)}</ProtectedRoute> },
      { path: 'organizations', element: <ProtectedRoute requireAdmin>{withSuspense(AdminOrganizationsPage)}</ProtectedRoute> },
      { path: 'verification', element: <ProtectedRoute requireAdmin>{withSuspense(AdminVerificationPage)}</ProtectedRoute> },
      { path: 'posts', element: <ProtectedRoute requireAdmin>{withSuspense(AdminPostsPage)}</ProtectedRoute> },
      { path: 'comments', element: <ProtectedRoute requireAdmin>{withSuspense(AdminCommentsPage)}</ProtectedRoute> },
      { path: 'messages', element: <ProtectedRoute requireAdmin>{withSuspense(AdminMessagesPage)}</ProtectedRoute> },
      { path: 'jobs', element: <ProtectedRoute requireAdmin>{withSuspense(AdminJobsPage)}</ProtectedRoute> },
      { path: 'internships', element: <ProtectedRoute requireAdmin>{withSuspense(AdminInternshipsPage)}</ProtectedRoute> },
      { path: 'events', element: <ProtectedRoute requireAdmin>{withSuspense(AdminEventsPage)}</ProtectedRoute> },
      { path: 'reports', element: <ProtectedRoute requireAdmin>{withSuspense(AdminReportsPage)}</ProtectedRoute> },
      { path: 'analytics', element: <ProtectedRoute requireAdmin>{withSuspense(AdminAnalyticsPage)}</ProtectedRoute> },
      { path: 'system', element: <ProtectedRoute requireAdmin>{withSuspense(AdminSystemPage)}</ProtectedRoute> },
      { path: 'settings', element: <ProtectedRoute requireAdmin>{withSuspense(AdminSettingsPage)}</ProtectedRoute> },
      { path: 'audit-logs', element: <ProtectedRoute requireAdmin>{withSuspense(AdminAuditLogsPage)}</ProtectedRoute> },
    ],
  },
]

const errorRoutes: RouteObject[] = [
  { path: '/unauthorized', element: withSuspense(UnauthorizedPage) },
  { path: '/forbidden', element: withSuspense(ForbiddenPage) },
  { path: '*', element: withSuspense(NotFoundPage) },
]

export const router = createBrowserRouter([
  ...publicRoutes,
  ...authenticatedRoutes,
  ...orgRoutes,
  ...adminRoutes,
  ...errorRoutes,
])
