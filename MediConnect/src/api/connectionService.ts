import api from '@/services/api'

export const connectionService = {
  sendRequest: (userId: string) => api.post('/connections/request', { receiver_id: userId }),
  acceptRequest: (connectionId: string) => api.patch(`/connections/${connectionId}/accept`),
  rejectRequest: (connectionId: string) => api.patch(`/connections/${connectionId}/reject`),
  cancelRequest: (connectionId: string) => api.delete(`/connections/${connectionId}/cancel`),
  removeConnection: (connectionId: string) => api.delete(`/connections/${connectionId}`),
  getConnectionStatus: (userId: string) => api.get(`/connections/status/${userId}`),
  acceptRequestByUserId: async (userId: string) => {
    const res = await api.get(`/connections/status/${userId}`)
    const data = res.data as { status: string; connection_id?: string }
    if (data?.status === 'pending_received' && data.connection_id) {
      return connectionService.acceptRequest(data.connection_id)
    }
    return { alreadyHandled: true }
  },
  rejectRequestByUserId: async (userId: string) => {
    const res = await api.get(`/connections/status/${userId}`)
    const data = res.data as { status: string; connection_id?: string }
    if (data?.status === 'pending_received' && data.connection_id) {
      return connectionService.rejectRequest(data.connection_id)
    }
    return { alreadyHandled: true }
  },
  getMyConnections: (page = 1, pageSize = 20, search?: string) => api.get('/connections', { params: { page, per_page: pageSize, search } }),
  getPendingRequests: (page = 1, pageSize = 20) => api.get('/connections/pending', { params: { page, per_page: pageSize } }),
  getSentRequests: (page = 1, pageSize = 20) => api.get('/connections/sent', { params: { page, per_page: pageSize } }),
  getSuggestions: (page = 1, pageSize = 20) => api.get('/connections/suggestions', { params: { page, per_page: pageSize } }),
  follow: (userId: string) => api.post('/connections/follow', { following_id: userId, following_type: 'user' }),
  unfollow: (userId: string) => api.delete(`/connections/unfollow/${userId}`),
  getFollowers: (page = 1, pageSize = 20) => api.get('/connections/followers', { params: { page, per_page: pageSize } }),
  getFollowing: (page = 1, pageSize = 20) => api.get('/connections/following', { params: { page, per_page: pageSize } }),
}
