import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/api/adminService'
import toast from 'react-hot-toast'
import axios from 'axios'

function errorText(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg)
  }
  return fallback
}

const ADMIN_KEYS = ['adminDashboard', 'adminStats', 'adminGrowth']

function useAdminInvalidate() {
  const qc = useQueryClient()
  return (...keys: string[]) => {
    keys.forEach(key => qc.invalidateQueries({ queryKey: [key] }))
    qc.invalidateQueries({ queryKey: ADMIN_KEYS })
  }
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['adminDashboard'],
    queryFn: () => adminService.getDashboard().then(r => r.data),
  })
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminService.getStats().then(r => r.data),
  })
}

export function useAdminGrowth(days = 30) {
  return useQuery({
    queryKey: ['adminGrowth', days],
    queryFn: () => adminService.getGrowth(days).then(r => r.data),
  })
}

export function useAdminUsers(filters?: { status?: string; role?: string; search?: string }) {
  return useQuery({
    queryKey: ['adminUsers', filters],
    queryFn: () => adminService.getUsers(1, 20, filters).then(r => r.data),
  })
}

export function useAdminUpdateUser() {
  const invalidate = useAdminInvalidate()
  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      adminService.updateUserStatus(userId, status),
    onSuccess: () => {
      invalidate('adminUsers')
      toast.success('User updated successfully')
    },
    onError: e => toast.error(errorText(e, 'Failed to update user')),
  })
}

export function useAdminUpdateUserRole() {
  const invalidate = useAdminInvalidate()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminService.updateUserRole(userId, role),
    onSuccess: () => {
      invalidate('adminUsers')
      toast.success('Role updated successfully')
    },
    onError: e => toast.error(errorText(e, 'Failed to update role')),
  })
}

export function useAdminDeleteUser() {
  const invalidate = useAdminInvalidate()
  return useMutation({
    mutationFn: (userId: string) => adminService.deleteUser(userId),
    onSuccess: () => {
      invalidate('adminUsers')
      toast.success('User deleted successfully')
    },
    onError: e => toast.error(errorText(e, 'Failed to delete user')),
  })
}

export function useAdminOrganizations() {
  return useQuery({
    queryKey: ['adminOrganizations'],
    queryFn: () => adminService.getOrganizations(1, 20).then(r => r.data),
  })
}

export function useAdminUpdateOrganization() {
  const invalidate = useAdminInvalidate()
  return useMutation({
    mutationFn: ({ orgId, status, notes }: { orgId: string; status: string; notes?: string }) =>
      adminService.updateOrganization(orgId, status, notes),
    onSuccess: () => {
      invalidate('adminOrganizations')
      toast.success('Organization updated')
    },
    onError: e => toast.error(errorText(e, 'Failed to update organization')),
  })
}

export function useAdminDeleteOrganization() {
  const invalidate = useAdminInvalidate()
  return useMutation({
    mutationFn: (orgId: string) => adminService.deleteOrganization(orgId),
    onSuccess: () => {
      invalidate('adminOrganizations')
      toast.success('Organization deleted')
    },
    onError: e => toast.error(errorText(e, 'Failed to delete organization')),
  })
}

export function useAdminVerificationRequests() {
  return useQuery({
    queryKey: ['adminVerifications'],
    queryFn: () => adminService.getVerificationRequests(1, 20).then(r => r.data),
  })
}

export function useAdminApproveVerification() {
  const invalidate = useAdminInvalidate()
  return useMutation({
    mutationFn: (userId: string) => adminService.approveVerification(userId),
    onSuccess: () => {
      invalidate('adminVerifications')
      toast.success('Verification approved')
    },
    onError: e => toast.error(errorText(e, 'Failed to approve verification')),
  })
}

export function useAdminRejectVerification() {
  const invalidate = useAdminInvalidate()
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      adminService.rejectVerification(userId, reason),
    onSuccess: () => {
      invalidate('adminVerifications')
      toast.success('Verification rejected')
    },
    onError: e => toast.error(errorText(e, 'Failed to reject verification')),
  })
}

export function useAdminRequestMoreInformation() {
  const invalidate = useAdminInvalidate()
  return useMutation({
    mutationFn: ({ userId, remarks }: { userId: string; remarks: string }) =>
      adminService.requestMoreInformation(userId, remarks),
    onSuccess: () => {
      invalidate('adminVerifications')
      toast.success('Requested more information')
    },
    onError: e => toast.error(errorText(e, 'Failed to request more information')),
  })
}

export function useAdminPosts(filters?: { post_status?: string; search?: string }) {
  return useQuery({
    queryKey: ['adminPosts', filters],
    queryFn: () => adminService.getPosts({ page: 1, per_page: 20, ...filters }).then(r => r.data),
  })
}

export function useAdminDeletePost() {
  const invalidate = useAdminInvalidate()
  return useMutation({
    mutationFn: (postId: string) => adminService.deletePost(postId),
    onSuccess: () => {
      invalidate('adminPosts')
      toast.success('Post deleted successfully')
    },
    onError: e => toast.error(errorText(e, 'Failed to delete post')),
  })
}

export function useAdminComments(filters?: { comment_status?: string; search?: string }) {
  return useQuery({
    queryKey: ['adminComments', filters],
    queryFn: () => adminService.getComments({ page: 1, per_page: 20, ...filters }).then(r => r.data),
  })
}

export function useAdminSetCommentStatus() {
  const invalidate = useAdminInvalidate()
  return useMutation({
    mutationFn: ({ commentId, status }: { commentId: string; status: string }) =>
      adminService.setCommentStatus(commentId, status),
    onSuccess: () => {
      invalidate('adminComments')
      toast.success('Comment updated')
    },
    onError: e => toast.error(errorText(e, 'Failed to update comment')),
  })
}

export function useAdminDeleteComment() {
  const invalidate = useAdminInvalidate()
  return useMutation({
    mutationFn: (commentId: string) => adminService.deleteComment(commentId),
    onSuccess: () => {
      invalidate('adminComments')
      toast.success('Comment deleted')
    },
    onError: e => toast.error(errorText(e, 'Failed to delete comment')),
  })
}

export function useAdminMessages(filters?: { search?: string }) {
  return useQuery({
    queryKey: ['adminMessages', filters],
    queryFn: () => adminService.getMessages({ page: 1, per_page: 20, ...filters }).then(r => r.data),
  })
}

export function useAdminSetMessageStatus() {
  const invalidate = useAdminInvalidate()
  return useMutation({
    mutationFn: ({ messageId, status }: { messageId: string; status: string }) =>
      adminService.setMessageStatus(messageId, status),
    onSuccess: () => {
      invalidate('adminMessages')
      toast.success('Message updated')
    },
    onError: e => toast.error(errorText(e, 'Failed to update message')),
  })
}

export function useAdminDeleteMessage() {
  const invalidate = useAdminInvalidate()
  return useMutation({
    mutationFn: (messageId: string) => adminService.deleteMessage(messageId),
    onSuccess: () => {
      invalidate('adminMessages')
      toast.success('Message content removed')
    },
    onError: e => toast.error(errorText(e, 'Failed to remove message')),
  })
}

export function useAdminJobs(filters?: { job_status?: string; search?: string }) {
  return useQuery({
    queryKey: ['adminJobs', filters],
    queryFn: () => adminService.getJobs({ page: 1, per_page: 20, ...filters }).then(r => r.data),
  })
}

export function useAdminUpdateJobStatus() {
  const invalidate = useAdminInvalidate()
  return useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: string }) =>
      adminService.updateJobStatus(jobId, status),
    onSuccess: () => {
      invalidate('adminJobs')
      toast.success('Job updated')
    },
    onError: e => toast.error(errorText(e, 'Failed to update job')),
  })
}

export function useAdminDeleteJob() {
  const invalidate = useAdminInvalidate()
  return useMutation({
    mutationFn: (jobId: string) => adminService.deleteJob(jobId),
    onSuccess: () => {
      invalidate('adminJobs')
      toast.success('Job deleted')
    },
    onError: e => toast.error(errorText(e, 'Failed to delete job')),
  })
}

export function useAdminInternships(filters?: { internship_status?: string; search?: string }) {
  return useQuery({
    queryKey: ['adminInternships', filters],
    queryFn: () => adminService.getInternships({ page: 1, per_page: 20, ...filters }).then(r => r.data),
  })
}

export function useAdminUpdateInternshipStatus() {
  const invalidate = useAdminInvalidate()
  return useMutation({
    mutationFn: ({ internshipId, status }: { internshipId: string; status: string }) =>
      adminService.updateInternshipStatus(internshipId, status),
    onSuccess: () => {
      invalidate('adminInternships')
      toast.success('Internship updated')
    },
    onError: e => toast.error(errorText(e, 'Failed to update internship')),
  })
}

export function useAdminDeleteInternship() {
  const invalidate = useAdminInvalidate()
  return useMutation({
    mutationFn: (internshipId: string) => adminService.deleteInternship(internshipId),
    onSuccess: () => {
      invalidate('adminInternships')
      toast.success('Internship deleted')
    },
    onError: e => toast.error(errorText(e, 'Failed to delete internship')),
  })
}

export function useAdminEvents(filters?: { event_status?: string; event_mode?: string; search?: string }) {
  return useQuery({
    queryKey: ['adminEvents', filters],
    queryFn: () => adminService.getEvents({ page: 1, per_page: 20, ...filters }).then(r => r.data),
  })
}

export function useAdminUpdateEventStatus() {
  const invalidate = useAdminInvalidate()
  return useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: string }) =>
      adminService.updateEventStatus(eventId, status),
    onSuccess: () => {
      invalidate('adminEvents')
      toast.success('Event updated')
    },
    onError: e => toast.error(errorText(e, 'Failed to update event')),
  })
}

export function useAdminDeleteEvent() {
  const invalidate = useAdminInvalidate()
  return useMutation({
    mutationFn: (eventId: string) => adminService.deleteEvent(eventId),
    onSuccess: () => {
      invalidate('adminEvents')
      toast.success('Event deleted')
    },
    onError: e => toast.error(errorText(e, 'Failed to delete event')),
  })
}

export function useAdminReports(reportStatus = 'pending') {
  return useQuery({
    queryKey: ['adminReports', reportStatus],
    queryFn: () => adminService.getReports(1, 20, reportStatus).then(r => r.data),
  })
}

export function useAdminResolveReport() {
  const invalidate = useAdminInvalidate()
  return useMutation({
    mutationFn: ({ reportId, action, remarks }: { reportId: string; action: string; remarks?: string }) =>
      adminService.resolveReport(reportId, action, remarks),
    onSuccess: () => {
      invalidate('adminReports')
      toast.success('Report resolved')
    },
    onError: e => toast.error(errorText(e, 'Failed to resolve report')),
  })
}

export function useAdminAnalytics(period = 'monthly') {
  return useQuery({
    queryKey: ['adminAnalytics', period],
    queryFn: () => adminService.getAnalytics(period).then(r => r.data),
  })
}

export function useAdminAuditLogs(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['adminAuditLogs', page, pageSize],
    queryFn: () => adminService.getAuditLogs(page, pageSize).then(r => r.data),
  })
}

export function useAdminSettings() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['adminSettings'],
    queryFn: () => adminService.getSettings().then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: (settings: Record<string, unknown>) => adminService.updateSettings(settings),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminSettings'] })
      toast.success('Settings updated')
    },
    onError: e => toast.error(errorText(e, 'Failed to update settings')),
  })

  return { ...query, updateMutation }
}

export function useAdminSystemHealth() {
  return useQuery({
    queryKey: ['adminSystemHealth'],
    queryFn: () => adminService.getSystemHealth().then(r => r.data),
  })
}