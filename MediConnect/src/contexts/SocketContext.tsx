import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { WS_BASE_URL } from '@/config'
import { tokenStorage } from '@/services/tokenStorage'
import { getFreshAccessToken } from '@/services/api'

interface SocketMessage {
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
}

interface SocketContextType {
  isConnected: boolean
  onlineUsers: Set<string>
  sendMessage: (message: SocketMessage) => void
  joinRoom: (roomId: string) => void
  leaveRoom: (roomId: string) => void
  onMessage: (callback: (message: SocketMessage) => void) => () => void
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  onlineUsers: new Set(),
  sendMessage: () => {},
  joinRoom: () => {},
  leaveRoom: () => {},
  onMessage: () => () => {},
})

function isTokenExpired(token: string): boolean {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const payload = JSON.parse(atob(padded)) as { exp?: number }
    return typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()
  } catch {
    return false
  }
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const listenersRef = useRef<Set<(msg: SocketMessage) => void>>(new Set())
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastRefreshRef = useRef<number>(0)

  const currentToken = () => tokenStorage.getAccess()

  const connect = useCallback(() => {
    if (!isAuthenticated) return
    const token = currentToken()
    if (!token) return
    const wsUrl = WS_BASE_URL + '/presence?token=' + token

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        ws.send(JSON.stringify({ type: 'ping' }))
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as SocketMessage
          if (msg.type === 'presence_update' && msg.payload?.online_users) {
            setOnlineUsers(new Set(msg.payload.online_users))
          }
          listenersRef.current.forEach(cb => cb(msg))
        } catch { /* ignore parse errors */ }
      }

      ws.onclose = () => {
        setIsConnected(false)
        if (!isAuthenticated) return
        reconnectTimeoutRef.current = setTimeout(async () => {
          const stored = currentToken()
          if (stored && isTokenExpired(stored) && Date.now() - lastRefreshRef.current > 30000) {
            try {
              lastRefreshRef.current = Date.now()
              await getFreshAccessToken()
            } catch { /* keep stored token; reconnect will fail and loop back */ }
          }
          connect()
        }, 5000)
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch { /* ignore */ }
  }, [isAuthenticated])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  useEffect(() => {
    if (!isConnected) return
    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [isConnected])

  const sendMessage = useCallback((message: SocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  const joinRoom = useCallback((roomId: string) => {
    sendMessage({ type: 'join_room', payload: { room_id: roomId } })
  }, [sendMessage])

  const leaveRoom = useCallback((roomId: string) => {
    sendMessage({ type: 'leave_room', payload: { room_id: roomId } })
  }, [sendMessage])

  const onMessage = useCallback((callback: (message: SocketMessage) => void) => {
    listenersRef.current.add(callback)
    return () => { listenersRef.current.delete(callback) }
  }, [])

  return (
    <SocketContext.Provider value={{ isConnected, onlineUsers, sendMessage, joinRoom, leaveRoom, onMessage }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
