import api from '@/services/api'

export interface Channel {
  _id: string
  name: string
  description?: string
  organization_id?: string | null
  created_by?: string
  members?: string[]
  created_at?: string
}

export interface ChannelMessage {
  _id: string
  channel_id: string
  sender_id: string
  content: string
  message_type?: string
  status?: string
  created_at?: string
}

export const channelService = {
  listChannels: () => api.get('/channels'),
  createChannel: (data: { name: string; description?: string; organization_id?: string | null }) => api.post('/channels', data),
  getChannelMessages: (channelId: string, page = 1, limit = 50) => api.get(`/channels/${channelId}/messages`, { params: { page, limit } }),
  sendChannelMessage: (channelId: string, content: string, message_type = 'text') => api.post(`/channels/${channelId}/messages`, { content, message_type }),
}