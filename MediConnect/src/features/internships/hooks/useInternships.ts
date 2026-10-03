import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { internshipService } from '@/api/internshipService'
import { getNextPageParam } from '@/lib/pagination'
import toast from 'react-hot-toast'

interface InternshipFilters {
  type?: string
  isRemote?: boolean
  skills?: string[]
  search?: string
}

export function useInternships(filters?: InternshipFilters) {
  return useInfiniteQuery({
    queryKey: ['internships', filters],
    queryFn: ({ pageParam = 1 }) => internshipService.getInternships(pageParam, 20, filters).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
  })
}

export function useInternship(id: string) {
  return useQuery({
    queryKey: ['internship', id],
    queryFn: () => internshipService.getInternship(id).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreateInternship() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => internshipService.createInternship(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['internships'] })
      toast.success('Internship created successfully')
    },
    onError: () => {
      toast.error('Failed to create internship')
    },
  })
}

export function useUpdateInternship() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => internshipService.updateInternship(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['internships'] })
      qc.invalidateQueries({ queryKey: ['internship'] })
      toast.success('Internship updated successfully')
    },
    onError: () => {
      toast.error('Failed to update internship')
    },
  })
}

export function useDeleteInternship() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => internshipService.deleteInternship(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['internships'] })
      toast.success('Internship deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete internship')
    },
  })
}

export function useApplyInternship() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: { resume?: string; coverLetter?: string } }) => internshipService.apply(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['internships'] })
      qc.invalidateQueries({ queryKey: ['internship'] })
      qc.invalidateQueries({ queryKey: ['appliedInternships'] })
      toast.success('Application submitted successfully')
    },
    onError: () => {
      toast.error('Failed to submit application')
    },
  })
}

export function useSaveInternship() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isSaved }: { id: string; isSaved: boolean }) => isSaved ? internshipService.unsaveInternship(id) : internshipService.saveInternship(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['internships'] })
      qc.invalidateQueries({ queryKey: ['internship'] })
      qc.invalidateQueries({ queryKey: ['savedInternships'] })
    },
  })
}

export function useSavedInternships() {
  return useInfiniteQuery({
    queryKey: ['savedInternships'],
    queryFn: ({ pageParam = 1 }) => internshipService.getSavedInternships(pageParam).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
  })
}

export function useRecommendedInternships() {
  return useInfiniteQuery({
    queryKey: ['recommendedInternships'],
    queryFn: ({ pageParam = 1 }) => internshipService.getRecommended(pageParam).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
  })
}
