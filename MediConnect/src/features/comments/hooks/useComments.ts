import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { postService } from '@/api/postService'
import api from '@/services/api'
import toast from 'react-hot-toast'

export function useComments(postId: string) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: () => postService.getComments(postId).then(r => r.data),
    enabled: !!postId,
  })
}

export function useAddComment(postId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => postService.addComment(postId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', postId] })
      qc.invalidateQueries({ queryKey: ['post', postId] })
      toast.success('Comment added')
    },
    onError: () => {
      toast.error('Failed to add comment')
    },
  })
}

export function useReplyToComment(postId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId: string }) => postService.addComment(postId, content, parentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', postId] })
      qc.invalidateQueries({ queryKey: ['post', postId] })
      toast.success('Reply added')
    },
    onError: () => {
      toast.error('Failed to add reply')
    },
  })
}

export function useDeleteComment(postId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) => postService.deleteComment(postId, commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', postId] })
      qc.invalidateQueries({ queryKey: ['post', postId] })
      toast.success('Comment deleted')
    },
    onError: () => {
      toast.error('Failed to delete comment')
    },
  })
}

export function useLikeComment(postId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) => api.post(`/posts/${postId}/comments/${commentId}/like`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', postId] })
    },
    onError: () => {
      toast.error('Failed to like comment')
    },
  })
}
