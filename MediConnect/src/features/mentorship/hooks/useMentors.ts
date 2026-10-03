import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mentorService } from '@/api/mentorService'
import { getNextPageParam } from '@/lib/pagination'

export function useMentors(filters?: Record<string, unknown>) {
  return useInfiniteQuery({
    queryKey: ['mentors', filters],
    queryFn: ({ pageParam = 1 }) => mentorService.getMentors(pageParam, 20, filters as Parameters<typeof mentorService.getMentors>[2]).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
  })
}

export function useMentor(id: string) {
  return useQuery({
    queryKey: ['mentor', id],
    queryFn: () => mentorService.getMentor(id).then(r => r.data),
    enabled: !!id,
  })
}

export function useRequestMentorship() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ mentorId, message }: { mentorId: string; message: string }) => mentorService.requestMentorship(mentorId, message),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentors'] }),
  })
}

export function useMyMentorRequests() {
  return useInfiniteQuery({
    queryKey: ['myMentorRequests'],
    queryFn: ({ pageParam = 1 }) => mentorService.getMyRequests(pageParam).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
  })
}

export function useMentorStatus() {
  return useQuery({
    queryKey: ['mentorStatus'],
    queryFn: () => mentorService.getMentorStatus().then(r => r.data),
  })
}

export function useApplyAsMentor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => mentorService.applyAsMentor(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentorStatus'] }),
  })
}

export function useOptOutMentor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => mentorService.optOutMentor(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mentorStatus'] })
      qc.invalidateQueries({ queryKey: ['mentors'] })
    },
  })
}

export function useMentorshipSessions(mentorshipId: string) {
  return useQuery({
    queryKey: ['mentorshipSessions', mentorshipId],
    queryFn: () => mentorService.getMentorshipSessions(mentorshipId).then(r => r.data),
    enabled: !!mentorshipId,
  })
}

export function useScheduleSession(mentorshipId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { scheduled_at: string; duration_minutes: number; topic: string }) => mentorService.scheduleSession(mentorshipId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mentorshipSessions', mentorshipId] })
      qc.invalidateQueries({ queryKey: ['mentorDashboard'] })
    },
  })
}

export function useCancelSession(mentorshipId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => mentorService.cancelSession(mentorshipId, sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mentorshipSessions', mentorshipId] })
      qc.invalidateQueries({ queryKey: ['mentorDashboard'] })
    },
  })
}

export function useCompleteSession(mentorshipId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => mentorService.updateSession(mentorshipId, sessionId, { completed: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mentorshipSessions', mentorshipId] })
      qc.invalidateQueries({ queryKey: ['mentorDashboard'] })
    },
  })
}

export function useSessionFeedback(mentorshipId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, rating, feedback }: { sessionId: string; rating: number; feedback: string }) => mentorService.submitSessionFeedback(sessionId, { rating, feedback }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mentorshipSessions', mentorshipId] })
      qc.invalidateQueries({ queryKey: ['mentorDashboard'] })
      qc.invalidateQueries({ queryKey: ['mentors'] })
    },
  })
}
