import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Notification } from '@/types'
import api from '@/services/api'
import { useAuth } from './AuthContext'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([])
      setUnreadCount(0)
      return
    }
    setIsLoading(true)
    try {
      const res = await api.get('/notifications', { params: { page: 1, page_size: 20 } })
      const data = res.data
      setNotifications(data?.notifications || data?.items || data || [])
      setUnreadCount(data?.unread_count || data?.unreadCount || 0)
    } catch {
      // silently fail
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.patch('/notifications/' + id + '/read')
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* ignore */ }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch { /* ignore */ }
  }, [])

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await api.delete('/notifications/' + id)
      setNotifications(prev => {
        const deleted = prev.find(n => n._id === id)
        if (deleted && !deleted.isRead) setUnreadCount(c => Math.max(0, c - 1))
        return prev.filter(n => n._id !== id)
      })
    } catch { /* ignore */ }
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, isLoading, fetchNotifications, markAsRead, markAllAsRead, deleteNotification }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within NotificationProvider')
  return context
}
