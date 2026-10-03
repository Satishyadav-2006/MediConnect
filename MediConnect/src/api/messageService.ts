import api from '@/services/api'

interface SendMessagePayload { content: string; type?: string; fileUrl?: string; fileName?: string; replyTo?: string }

export const messageService = {
  getConversations: (page = 1, pageSize = 20, search?: string) => api.get('/messages/conversations', { params: { page, per_page: pageSize, search } }),
  getMessages: (conversationId: string, page = 1, pageSize = 50) => api.get(`/messages/${conversationId}`, { params: { page, per_page: pageSize } }),
  sendMessage: (conversationId: string, data: SendMessagePayload) => api.post(`/messages/${conversationId}`, data),
  sendDirectMessage: (recipientId: string, content: string) => api.post('/messages', { recipient_id: recipientId, content }),
  createConversation: (participantIds: string[], type = 'direct') => api.post('/messages/conversations', { participant_ids: participantIds, conversation_type: type, title: '' }),
  markAsRead: (conversationId: string) => api.put(`/messages/${conversationId}/read`),
  editMessage: (messageId: string, content: string) => api.put(`/messages/message/${messageId}`, { content }),
  deleteMessage: (messageId: string, forEveryone = false) => api.delete(`/messages/message/${messageId}`, { params: { forEveryone } }),
  pinMessage: (messageId: string) => api.post(`/messages/message/${messageId}/pin`),
  unpinMessage: (messageId: string) => api.delete(`/messages/message/${messageId}/pin`),
  getPinnedMessages: (conversationId: string) => api.get(`/messages/${conversationId}/pinned`),
  searchMessages: (conversationId: string, query: string) => api.get(`/messages/${conversationId}/search`, { params: { query } }),
  getSharedFiles: (conversationId: string, page = 1, pageSize = 20) => api.get(`/messages/${conversationId}/shared-files`, { params: { page, per_page: pageSize } }),
  forwardMessage: (messageId: string, conversationId: string) => api.post(`/messages/message/${messageId}/forward`, { conversationId }),
  reactToMessage: (messageId: string, emoji: string) => api.post(`/messages/message/${messageId}/react`, { emoji }),
  removeReaction: (messageId: string, emoji: string) => api.delete(`/messages/message/${messageId}/react`, { params: { emoji } }),
  getOrganizationChannels: (organizationId: string) => api.get(`/messages/organizations/${organizationId}/channels`),
  createChannel: (organizationId: string, data: { name: string; type: 'channel' | 'broadcast' }) =>
    api.post(`/messages/organizations/${organizationId}/channels`, data),
  getChannelMessages: (channelId: string, page = 1, pageSize = 50) =>
    api.get(`/messages/channels/${channelId}`, { params: { page, per_page: pageSize } }),
  sendChannelMessage: (channelId: string, data: SendMessagePayload) => api.post(`/messages/channels/${channelId}`, data),
}
