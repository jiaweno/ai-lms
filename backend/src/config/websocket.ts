import { FastifyInstance } from 'fastify' 
import { Server as SocketIOServer, Socket } from 'socket.io' 
import { Redis } from 'ioredis'
import { logger } from '@/utils/logger'
import { env } from './env'
import jwt from 'jsonwebtoken'

export interface SocketUser {
  id: string
  email: string
  role: string
  name?: string 
}

export interface NotificationData {
  id?: string; 
  type: string;
  title: string;
  message: string;
  data?: any;
  userId?: string; 
  recipients?: string[]; 
  createdAt?: string; 
}

export class WebSocketService {
  private io: SocketIOServer
  private redisPub: Redis 
  private redisSub: Redis 
  private userSockets: Map<string, Set<string>> = new Map() 

  constructor(server: FastifyInstance['server'], redisClient: Redis) { 
    this.redisPub = redisClient;
    this.redisSub = redisClient.duplicate(); 

    this.io = new SocketIOServer(server, {
      cors: {
        origin: env.CORS_ORIGIN.split(','),
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingInterval: 10000, 
      pingTimeout: 5000,   
    })

    this.setupEventHandlers()
    this.setupRedisSubscription()
  }

  private setupEventHandlers() {
    this.io.use(async (socket: Socket, next) => { 
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, env.JWT_SECRET) as any;
        const user: SocketUser = {
          id: decoded.userId,
          email: decoded.email, // Assuming email is in JWT; otherwise, fetch from DB
          role: decoded.role,
          name: decoded.name || 'User', 
        };

        socket.data.user = user; 
        next();
      } catch (error: any) {
        logger.error('WebSocket authentication error:', { message: error.message });
        next(new Error('Authentication failed: Invalid token'));
      }
    })

    this.io.on('connection', (socket: Socket) => { 
      const user = socket.data.user as SocketUser;
      logger.info(`User ${user.email} (ID: ${user.id}) connected via WebSocket (Socket ID: ${socket.id})`);

      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      this.userSockets.get(user.id)!.add(socket.id);

      socket.join(`user:${user.id}`);
      socket.join(`role:${user.role}`);

      socket.on('join_exam', (examId: string) => {
        socket.join(`exam:${examId}`);
        logger.debug(`User ${user.id} joined exam room: ${examId}`);
      });

      socket.on('leave_exam', (examId: string) => {
        socket.leave(`exam:${examId}`);
        logger.debug(`User ${user.id} left exam room: ${examId}`);
      });
      
      socket.on('heartbeat', (data: any, callback: Function) => { 
        if (typeof callback === 'function') {
          callback({ timestamp: Date.now() });
        }
      });

      socket.on('disconnect', (reason) => {
        logger.info(`User ${user.email} (ID: ${user.id}) disconnected (Socket ID: ${socket.id}): ${reason}`);
        const userSocketSet = this.userSockets.get(user.id);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          if (userSocketSet.size === 0) {
            this.userSockets.delete(user.id);
          }
        }
      });
    });
  }

  private async setupRedisSubscription() { 
    try {
      await this.redisSub.subscribe('notifications', 'exam_events', 'system_events');
      
      this.redisSub.on('message', (channel, message) => {
        try {
          const data = JSON.parse(message);
          switch (channel) {
            case 'notifications':
              this.handleNotification(data as NotificationData); 
              break;
            case 'exam_events':
              this.handleExamEvent(data);
              break;
            case 'system_events':
              this.handleSystemEvent(data);
              break;
          }
        } catch (error) {
          logger.error(`Error processing Redis message from ${channel}:`, error);
        }
      });
      logger.info('🔌 WebSocket Redis subscription established for channels: notifications, exam_events, system_events');
    } catch (error) {
        logger.error('❌ Failed to subscribe to Redis channels:', error);
    }
  }

  private handleNotification(data: NotificationData) {
    logger.info(`Handling notification: ${data.title} for user: ${data.userId || 'broadcast/multiple'}`);
    if (data.userId) {
      this.io.to(`user:${data.userId}`).emit('notification', data);
    } else if (data.recipients && data.recipients.length > 0) {
      data.recipients.forEach(userId => {
        this.io.to(`user:${userId}`).emit('notification', data);
      });
    } else {
      this.io.emit('notification', data); 
    }
  }

  private handleExamEvent(data: any) {
    const { examId, type, ...eventData } = data;
    logger.info(`Handling exam event: ${type} for exam: ${examId}`);
    this.io.to(`exam:${examId}`).emit(type, eventData); 
  }

  private handleSystemEvent(data: any) {
    const { type, ...eventData } = data;
    logger.info(`Handling system event: ${type}`);
    this.io.emit(type, eventData); 
  }

  async publishNotification(notification: NotificationData) {
    try {
      await this.redisPub.publish('notifications', JSON.stringify(notification));
      logger.debug(`Notification published to Redis: ${notification.title}`);
    } catch (error) {
      logger.error('Error publishing notification to Redis:', error);
    }
  }

  async publishExamEvent(examId: string, type: string, data: any) {
    try {
      await this.redisPub.publish('exam_events', JSON.stringify({ examId, type, ...data }));
      logger.debug(`Exam event published to Redis: ${type} for exam ${examId}`);
    } catch (error) {
      logger.error('Error publishing exam event to Redis:', error);
    }
  }
  
  async publishSystemEvent(type: string, data: any) {
    try {
      await this.redisPub.publish('system_events', JSON.stringify({ type, ...data }));
      logger.debug(`System event published to Redis: ${type}`);
    } catch (error) {
      logger.error('Error publishing system event to Redis:', error);
    }
  }


  getOnlineStats() {
    return {
      totalConnections: this.io.sockets.sockets.size,
      uniqueUsers: this.userSockets.size,
    };
  }

  async sendToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  async sendToRole(role: string, event: string, data: any) {
    this.io.to(`role:${role}`).emit(event, data);
  }

  async broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

let webSocketServiceInstance: WebSocketService | null = null;

export const initializeWebSocketService = (server: FastifyInstance['server'], redisClient: Redis) => {
  if (!webSocketServiceInstance) {
    webSocketServiceInstance = new WebSocketService(server, redisClient);
    logger.info('🚀 WebSocket Service Initialized');
  }
  return webSocketServiceInstance;
};

export const getWebSocketService = (): WebSocketService => {
  if (!webSocketServiceInstance) {
    throw new Error('WebSocket service has not been initialized. Call initializeWebSocketService first.');
  }
  return webSocketServiceInstance;
};
