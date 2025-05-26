import { useState, useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

interface UseWebSocketOptions {
  autoConnect?: boolean
  enableHeartbeat?: boolean
  heartbeatInterval?: number
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    autoConnect = true,
    enableHeartbeat = true,
    heartbeatInterval = 30000, // 30秒
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const { token, isAuthenticated } = useAuthStore()

  // 连接WebSocket
  const connect = useCallback(() => {
    if (!isAuthenticated || !token || socketRef.current?.connected) {
      return
    }

    try {
      // Ensure VITE_WS_URL is defined in your .env and accessible
      const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
      const socket = io(wsUrl, {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })

      // 连接事件
      socket.on('connect', () => {
        setIsConnected(true)
        setConnectionError(null)
        console.log('WebSocket connected')

        // 启动心跳
        if (enableHeartbeat) {
          startHeartbeat(socket)
        }
      })

      socket.on('disconnect', (reason) => {
        setIsConnected(false)
        console.log('WebSocket disconnected:', reason)
        
        // 停止心跳
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current)
          heartbeatRef.current = null
        }
      })

      socket.on('connect_error', (error) => {
        setConnectionError(error.message)
        console.error('WebSocket connection error:', error)
      })

      // 通知事件
      socket.on('notification', (notification) => {
        handleNotification(notification)
      })

      // 考试事件
      socket.on('exam_started', (data) => {
        toast.success('考试已开始')
      })

      socket.on('exam_ended', (data) => {
        toast.info('考试已结束')
      })

      socket.on('time_warning', (data) => {
        toast.warning(`考试剩余时间：${data.timeRemaining}分钟`)
      })

      socket.on('answer_saved', (data) => {
        // 答案保存确认，可以显示保存状态
        // toast.success("答案已自动保存", { duration: 1000, position: "bottom-right"});
      })

      // 系统事件
      socket.on('maintenance_mode', (data) => {
        toast.error('系统即将进入维护模式')
      })

      socket.on('server_restart', (data) => {
        toast.warning('服务器即将重启，请保存工作')
      })

      socket.on('feature_update', (data) => {
        toast.info('系统已更新新功能')
      })
      
      socket.on('heartbeat_ack', (data) => {
        // console.log("Heartbeat acknowledged by server:", data);
      });


      socketRef.current = socket
    } catch (error: any) {
      console.error('Failed to connect WebSocket:', error)
      setConnectionError(error.message)
    }
  }, [token, isAuthenticated, enableHeartbeat, heartbeatInterval]) // Added heartbeatInterval to dependencies

  // 断开连接
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
    
    setIsConnected(false)
  }, [])

  // 启动心跳
  const startHeartbeat = (socket: Socket) => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
    }

    heartbeatRef.current = setInterval(() => {
      if (socket.connected) {
        socket.emit('heartbeat', { timestamp: Date.now() }, (response: any) => {
          // Optional: handle ack from server if needed
          // console.log("Heartbeat ack received:", response);
        });
      }
    }, heartbeatInterval)
  }

  // 处理通知
  const handleNotification = (notification: any) => {
    const { type, title, message, priority, data } = notification // Include data for actionUrl

    // Example: Show toast notification
    // You might want to integrate this with a more sophisticated notification system UI
    const toastOptions: any = { duration: 5000 };
    if (data?.actionUrl) {
        toastOptions.onClick = () => {
            // Handle navigation or action, e.g., window.open(data.actionUrl, '_blank')
            // Or use react-router navigate if it's an internal link
            console.log("Notification clicked, actionUrl:", data.actionUrl);
        };
    }

    switch (priority) {
      case 'URGENT':
        toast.error(`${title}: ${message}`, toastOptions)
        break
      case 'HIGH':
        toast.success(`${title}: ${message}`, toastOptions) // Using success for high priority for visibility
        break
      case 'NORMAL':
        toast.info(message, toastOptions)
        break
      case 'LOW':
      default:
        toast(message, toastOptions)
        break
    }

    // 触发自定义事件，供其他组件监听（e.g., NotificationCenter)
    window.dispatchEvent(new CustomEvent('app_notification', { // Changed event name to avoid conflict
      detail: notification,
    }))
  }

  // 发送消息
  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    } else {
      console.warn(`WebSocket not connected. Cannot emit event: ${event}`);
    }
  }, [])

  // 监听事件
  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback)
    }
  }, [])

  // 取消监听事件
  const off = useCallback((event: string, callback?: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback)
    }
  }, [])

  // 加入房间
  const joinRoom = useCallback((room: string) => {
    emit('join_room', room)
  }, [emit])

  // 离开房间
  const leaveRoom = useCallback((room: string) => {
    emit('leave_room', room)
  }, [emit])

  // 加入考试房间
  const joinExam = useCallback((examId: string) => {
    emit('join_exam', examId)
  }, [emit])

  // 离开考试房间
  const leaveExam = useCallback((examId: string) => {
    emit('leave_exam', examId)
  }, [emit])

  // 自动连接
  useEffect(() => {
    if (autoConnect && isAuthenticated && token) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, isAuthenticated, token, connect, disconnect])

  // 认证状态改变时重连
  useEffect(() => {
    if (!isAuthenticated && socketRef.current) {
      disconnect()
    }
  }, [isAuthenticated, disconnect])

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
    emit,
    on,
    off,
    joinRoom,
    leaveRoom,
    joinExam,
    leaveExam,
    socket: socketRef.current // Expose socket instance if direct access is needed
  }
}
