import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { settingsService } from '@/api/settingsService'
import toast from 'react-hot-toast'

export function useNotificationSettings() {
  return useQuery({
    queryKey: ['notificationSettings'],
    queryFn: () => settingsService.getNotificationSettings().then(r => r.data),
  })
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (settings: Record<string, boolean>) => settingsService.updateNotificationSettings(settings),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notificationSettings'] })
      toast.success('Notification settings updated')
    },
    onError: () => {
      toast.error('Failed to update notification settings')
    },
  })
}

export function usePrivacySettings() {
  return useQuery({
    queryKey: ['privacySettings'],
    queryFn: () => settingsService.getPrivacySettings().then(r => r.data),
  })
}

export function useUpdatePrivacySettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (settings: Record<string, unknown>) => settingsService.updatePrivacySettings(settings),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['privacySettings'] })
      toast.success('Privacy settings updated')
    },
    onError: () => {
      toast.error('Failed to update privacy settings')
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => settingsService.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully')
    },
    onError: () => {
      toast.error('Failed to change password')
    },
  })
}

export function useBlockedUsers() {
  return useQuery({
    queryKey: ['blockedUsers'],
    queryFn: () => settingsService.getBlockedUsers().then(r => r.data),
  })
}

export function useBlockUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => settingsService.blockUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blockedUsers'] })
      toast.success('User blocked successfully')
    },
    onError: () => {
      toast.error('Failed to block user')
    },
  })
}

export function useUnblockUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => settingsService.unblockUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blockedUsers'] })
      toast.success('User unblocked successfully')
    },
    onError: () => {
      toast.error('Failed to unblock user')
    },
  })
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => settingsService.deleteAccount(),
    onSuccess: () => {
      toast.success('Account deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete account')
    },
  })
}
