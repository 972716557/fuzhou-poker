import { useState, useEffect, useRef, useCallback } from 'react'

const WS_URL = import.meta.env.DEV
  ? `ws://${window.location.hostname}:4567`
  : `ws://${window.location.hostname}:4567`

export function useWebSocket() {
  const wsRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [connectionState, setConnectionState] = useState('disconnected')
  const listenersRef = useRef(new Map())
  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef(null)
  const intentionalCloseRef = useRef(false)

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState <= 1) return

    setConnectionState('connecting')
    const ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      wsRef.current = ws
      setConnected(true)
      setConnectionState('connected')
      reconnectAttemptRef.current = 0

      // 尝试重连
      const saved = sessionStorage.getItem('fuzhou_reconnect')
      if (saved) {
        try {
          const { roomId, playerId, token } = JSON.parse(saved)
          ws.send(JSON.stringify({
            type: 'c2s:reconnect',
            payload: { roomId, playerId, token },
          }))
        } catch (e) {
          sessionStorage.removeItem('fuzhou_reconnect')
        }
      }
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        // 通知所有监听者
        for (const cb of listenersRef.current.values()) {
          cb(msg)
        }
      } catch (e) { /* ignore malformed */ }
    }

    ws.onclose = () => {
      wsRef.current = null
      setConnected(false)

      if (!intentionalCloseRef.current) {
        // 指数退避重连
        setConnectionState('reconnecting')
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 30000)
        reconnectAttemptRef.current++
        reconnectTimerRef.current = setTimeout(connect, delay)
      } else {
        setConnectionState('disconnected')
      }
    }

    ws.onerror = () => {
      // onclose will fire after this
    }
  }, [])

  // 初始化连接
  useEffect(() => {
    connect()
    return () => {
      intentionalCloseRef.current = true
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [connect])

  const send = useCallback((msg) => {
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  /** 注册消息监听器，返回取消函数 */
  const onMessage = useCallback((id, callback) => {
    listenersRef.current.set(id, callback)
    return () => listenersRef.current.delete(id)
  }, [])

  return { connected, connectionState, send, onMessage }
}
