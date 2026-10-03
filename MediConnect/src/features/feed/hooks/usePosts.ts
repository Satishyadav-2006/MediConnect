import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { postService } from '@/api/postService'
import { getNextPageParam } from '@/lib/pagination'

export function useFeed(category = 'latest', enabled = true) {
  return useInfiniteQuery({
    queryKey: ['feed', category],
    queryFn: ({ pageParam = 1 }) => postService.getFeed(pageParam, 20, category).then(r => r.data),
    enabled,
    getNextPageParam,
    initialPageParam: 1,
  })
}

export function useCreatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: postService.createPost,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  })
}

export function useLikePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isLiked }: { id: string; isLiked: boolean }) => isLiked ? postService.unlikePost(id) : postService.likePost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  })
}

export function useSavePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isSaved }: { id: string; isSaved: boolean }) => isSaved ? postService.unsavePost(id) : postService.savePost(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['feed'] }); qc.invalidateQueries({ queryKey: ['savedPosts'] }) },
  })
}

export function useDeletePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => postService.deletePost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  })
}
