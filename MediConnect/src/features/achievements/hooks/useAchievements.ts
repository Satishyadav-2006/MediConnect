import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

export function useAchievements(userId?: string) {
  return useQuery({
    queryKey: ['achievements', userId],
    queryFn: () => {
      const url = userId ? `/achievements?userId=${userId}` : '/achievements'
      return api.get(url).then(r => r.data)
    },
  })
}

export function useAchievementProgress() {
  return useQuery({
    queryKey: ['achievementProgress'],
    queryFn: () => api.get('/achievements/progress').then(r => r.data),
  })
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/achievements/leaderboard').then(r => r.data),
  })
}

export function useEarnedAchievements(userId?: string) {
  return useQuery({
    queryKey: ['earnedAchievements', userId],
    queryFn: () => {
      const url = userId ? `/achievements/earned?userId=${userId}` : '/achievements/earned'
      return api.get(url).then(r => r.data)
    },
  })
}

export function useAvailableAchievements() {
  return useQuery({
    queryKey: ['availableAchievements'],
    queryFn: () => api.get('/achievements/available').then(r => r.data),
  })
}
