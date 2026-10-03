import api from '@/services/api'

export interface PostMediaItem {
  cloudinary_url: string
  media_type: string
  file_name?: string
  mime_type?: string
  file_size?: number
}

export interface CreatePostPayload {
  content: string
  visibility: string
  post_type?: string
  media?: PostMediaItem[]
  hashtags?: string[]
  mentions?: string[]
  location?: string
  organization_id?: string | null
  images?: string[]
  video?: string
  document?: { url: string; name: string; type: string }
  poll?: { question: string; options: string[]; endsAt?: string }
  research?: { title: string; abstract: string; journal?: string; authors: string[]; doi?: string }
  tags?: string[]
}

export const postService = {
  createPost: (data: CreatePostPayload) => api.post('/posts', data),
  getFeed: (page = 1, perPage = 20, feedType = 'home') => api.get('/posts/feed', { params: { page, per_page: perPage, feed_type: feedType } }),
  getOrganizationPosts: (organizationId: string, page = 1, perPage = 20) => api.get('/posts/feed', { params: { page, per_page: perPage, organization: organizationId } }),
  getPost: (id: string) => api.get(`/posts/${id}`),
  updatePost: (id: string, data: Partial<CreatePostPayload>) => api.patch(`/posts/${id}`, data),
  deletePost: (id: string) => api.delete(`/posts/${id}`),
  likePost: (id: string) => api.post(`/posts/${id}/react`, { reaction_type: 'like' }),
  unlikePost: (id: string) => api.delete(`/posts/${id}/react`),
  reactToPost: (id: string, reactionType: string) => api.post(`/posts/${id}/react`, { reaction_type: reactionType }),
  savePost: (id: string) => api.post(`/posts/${id}/bookmark`),
  unsavePost: (id: string) => api.delete(`/posts/${id}/bookmark`),
  sharePost: (id: string) => api.post(`/posts/${id}/share`),
  getComments: (postId: string, page = 1, pageSize = 20) => api.get(`/posts/${postId}/comments`, { params: { page, per_page: pageSize } }),
  addComment: (postId: string, content: string, parentId?: string) => api.post(`/posts/${postId}/comments`, { content, parent_comment_id: parentId }),
  deleteComment: (postId: string, commentId: string) => api.delete(`/posts/${postId}/comments/${commentId}`),
  getTrending: (page = 1, pageSize = 20) => api.get('/posts/trending', { params: { page, per_page: pageSize } }),
  getSavedPosts: (page = 1, pageSize = 20) => api.get('/posts/bookmarks', { params: { page, per_page: pageSize } }),
  getUserPosts: (userId: string, page = 1, pageSize = 20) => api.get(`/users/${userId}/posts`, { params: { page, per_page: pageSize } }),
  uploadPostMedia: (file: File) => { const fd = new FormData(); fd.append('file', file); return api.post('/uploads/post-media', fd) },
  uploadImage: (file: File) => { const fd = new FormData(); fd.append('file', file); return api.post('/uploads/image', fd) },
  uploadVideo: (file: File) => { const fd = new FormData(); fd.append('file', file); return api.post('/uploads/video', fd) },
  uploadDocument: (file: File) => { const fd = new FormData(); fd.append('file', file); return api.post('/uploads/document', fd) },
}
