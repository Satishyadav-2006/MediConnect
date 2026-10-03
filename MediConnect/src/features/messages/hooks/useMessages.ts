import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messageService } from '@/api/messageService'
import { getNextPageParam } from '@/lib/pagination'

export function useConversations() {
  return useInfiniteQuery({
    queryKey: ['conversations'],
    queryFn: ({ pageParam = 1 }) => messageService.getConversations(pageParam).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
  })
}

export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam = 1 }) => messageService.getMessages(conversationId, pageParam).then(r => r.data),
    getNextPageParam,
    initialPageParam: 1,
    enabled: !!conversationId,
  })
}

export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ conversationId, data }: { conversationId: string; data: { content: string } }) => messageService.sendMessage(conversationId, data).then(r => r.data),
    onMutate: async ({ conversationId, data }) => {
      await qc.cancelQueries({ queryKey: ['messages', conversationId] })
      const previous = qc.getQueryData(['messages', conversationId])
      qc.setQueryData(['messages', conversationId], (old: any) => {
        if (!old || !Array.isArray(old.pages) || old.pages.length === 0) return old
        const pages = old.pages.map((page: any, i: number) => {
          if (i !== old.pages.length - 1) return page
          const items = Array.isArray(page?.items) ? [...page.items] : []
          items.push({
            _id: `optimistic-${Date.now()}`,
            content: data.content,
            sender: { _id: 'self' },
            createdAt: new Date().toISOString(),
            readBy: [],
            deliveredTo: [],
            type: 'text',
          })
          return { ...page, items }
        })
        return { ...old, pages }
      })
      return { previous }
    },
    onError: (_err, vars, context) => {
      if (context?.previous) qc.setQueryData(['messages', vars.conversationId], context.previous)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['messages', vars.conversationId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useMarkAsRead(conversationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => messageService.markAsRead(conversationId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['messages', conversationId] }); qc.invalidateQueries({ queryKey: ['conversations'] }) },
  })
}

export function useCreateConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (participantIds: string[]) => messageService.createConversation(participantIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  })
}

export function useEditMessage(conversationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) => messageService.editMessage(messageId, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', conversationId] }),
  })
}

export function useDeleteMessage(conversationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ messageId, forEveryone }: { messageId: string; forEveryone: boolean }) => messageService.deleteMessage(messageId, forEveryone),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['messages', conversationId] }); qc.invalidateQueries({ queryKey: ['conversations'] }) },
  })
}

export function usePinMessage(conversationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ messageId, pin }: { messageId: string; pin: boolean }) => pin ? messageService.pinMessage(messageId) : messageService.unpinMessage(messageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', conversationId] }),
  })
}

export function useForwardMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ messageId, conversationId }: { messageId: string; conversationId: string }) => messageService.forwardMessage(messageId, conversationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  })
}

export function useReactToMessage(conversationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ messageId, emoji, remove }: { messageId: string; emoji: string; remove?: boolean }) =>
      remove ? messageService.removeReaction(messageId, emoji) : messageService.reactToMessage(messageId, emoji),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', conversationId] }),
  })
}
