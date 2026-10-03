import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileService } from '@/api/profileService'
import { useAuth } from '@/contexts/AuthContext'

export function useProfile(username: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => profileService.getProfile(username).then(r => r.data),
    enabled: !!username,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  const { refreshUser } = useAuth()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await profileService.updateProfile(data as Parameters<typeof profileService.updateProfile>[0])
      const body = res.data
      const updated = body && typeof body === 'object' && 'user' in body ? body.user : body
      return (updated ?? undefined) as { username?: string; user_id?: string } | undefined
    },
    onSuccess: (updated) => {
      if (updated) {
        const key = updated.username ?? updated.user_id
        if (key) qc.setQueryData(['profile', key], updated)
      }
      qc.invalidateQueries({ queryKey: ['profile'] })
      void refreshUser()
    },
  })
}

export function useUpdateProfessional() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => profileService.updateProfessional(data as Parameters<typeof profileService.updateProfessional>[0]),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })
}

export function useUploadPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => profileService.uploadPhoto(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })
}

export function useUploadBanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => profileService.uploadBanner(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })
}
