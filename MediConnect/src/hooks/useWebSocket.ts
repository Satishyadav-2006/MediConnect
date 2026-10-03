import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { WS_BASE_URL } from '@/config'

interface WebSocketMessage {
  type: string
  payload: unknown
}

interface UseWebSocketOptions {
  url?: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

interface UseWebSocketReturn {
  isConnected: boolean
  isReconnecting: boolean
  reconnectCount: number
  send: (message: WebSocketMessage) => void
  disconnect: () => void
  reconnect: () => void
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    url = WS_BASE_URL,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    heartbeatInterval = 30000,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  } = options

  const { token } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [reconnectCount, setReconnectCount] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const shouldReconnectRef = useRef(true)
  const mountedRef = useRef(true)

  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current)
      heartbeatTimerRef.current = null
    }
  }, [])

  const startHeartbeat = useCallback(() => {
    clearTimers()
    heartbeatTimerRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }))
      }
    }, heartbeatInterval)
  }, [heartbeatInterval, clearTimers])

  const connect = useCallback(() => {
    if (!token || !mountedRef.current) return

    const wsUrl = `${url}?token=${token}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) return
      setIsConnected(true)
      setIsReconnecting(false)
      setReconnectCount(0)
      shouldReconnectRef.current = true
      startHeartbeat()
      onConnect?.()
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage
        if (message.type === 'pong') return
        onMessage?.(message)
      } catch {
        console.warn('Failed to parse WebSocket message')
      }
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      setIsConnected(false)
      clearTimers()
      onDisconnect?.()

      if (shouldReconnectRef.current && reconnectCount < maxReconnectAttempts) {
        setIsReconnecting(true)
        reconnectTimerRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setReconnectCount((prev) => prev + 1)
            connect()
          }
        }, reconnectInterval * Math.min(reconnectCount + 1, 5))
      }
    }

    ws.onerror = (error) => {
      onError?.(error)
      ws.close()
    }
  }, [token, url, onConnect, onDisconnect, onError, onMessage, startHeartbeat, clearTimers, reconnectCount, reconnectInterval, maxReconnectAttempts])

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false
    clearTimers()
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
    setIsReconnecting(false)
  }, [clearTimers])

  const reconnect = useCallback(() => {
    disconnect()
    setReconnectCount(0)
    shouldReconnectRef.current = true
    setTimeout(() => {
      if (mountedRef.current) connect()
    }, 500)
  }, [disconnect, connect])

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      disconnect()
    }
  }, [token])

  return { isConnected, isReconnecting, reconnectCount, send, disconnect, reconnect }
}
