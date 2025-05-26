import { prisma } from '@/config/database'
import { getWebSocketService, NotificationData as WebSocketNotificationData } from '@/config/websocket' 
import { CacheManager } from '@/config/cache'; 
import { redis } from '@/config/redis'; 
import { logger } from '@/utils/logger'
import { v4 as uuidv4 } from 'uuid'
import { Role } from '@prisma/client'; // Import Role enum

// Initialize CacheManager with the Redis client
const cacheManager = new CacheManager(redis);

export interface CreateNotificationParams {
  type: string;
  title: string;
  message: string;
  data?: any; 
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category?: string;
  actionUrl?: string;
}

export const notificationService = {
  async sendToUser(userId: string, notificationParams: CreateNotificationParams) {
    try {
      const dbNotification = await prisma.notification.create({
        data: {
          id: uuidv4(),
          userId,
          type: notificationParams.type,
          title: notificationParams.title,
          message: notificationParams.message,
          metadata: { 
            priority: notificationParams.priority || 'NORMAL',
            category: notificationParams.category,
            actionUrl: notificationParams.actionUrl,
            ...notificationParams.data, 
          },
          read: false, 
        },
      });

      const wsNotificationData: WebSocketNotificationData = {
        id: dbNotification.id,
        type: dbNotification.type,
        title: dbNotification.title,
        message: dbNotification.message,
        userId: dbNotification.userId,
        createdAt: dbNotification.createdAt.toISOString(),
        data: dbNotification.metadata as object ?? undefined, 
      };

      const wsService = getWebSocketService();
      await wsService.publishNotification(wsNotificationData);

      await this.incrementUnreadCount(userId);
      logger.info(`Notification sent to user ${userId}: ${notificationParams.title}`);
      return dbNotification;
    } catch (error) {
      logger.error('Error sending notification to user:', error);
      throw error;
    }
  },

  async sendToMultipleUsers(userIds: string[], notificationParams: CreateNotificationParams) {
    const results = [];
    for (const userId of userIds) {
      try {
        const result = await this.sendToUser(userId, notificationParams);
        results.push({ userId, success: true, notificationId: result.id });
      } catch (error: any) {
        logger.error(`Failed to send notification to user ${userId}:`, error);
        results.push({ userId, success: false, error: error.message });
      }
    }
    return results;
  },

  async sendToRole(role: Role, notificationParams: CreateNotificationParams) { // Changed role type to Role enum
    try {
      const users = await prisma.user.findMany({
        where: { role: role, isActive: true }, 
        select: { id: true },
      });
      const userIds = users.map(user => user.id);
      return await this.sendToMultipleUsers(userIds, notificationParams);
    } catch (error) {
      logger.error(`Error sending notification to role ${role}:`, error);
      throw error;
    }
  },

  async broadcast(notificationParams: CreateNotificationParams) {
    try {
      const users = await prisma.user.findMany({
        where: { isActive: true }, 
        select: { id: true },
      });
      const userIds = users.map(user => user.id);
      // For a true broadcast to all connected clients without individual DB records:
      // const wsService = getWebSocketService();
      // const wsNotificationData: WebSocketNotificationData = { /* ... construct data ... */ };
      // await wsService.broadcast('system_notification', wsNotificationData);
      // logger.info(`Broadcasted system notification: ${notificationParams.title}`);
      // return { success: true, message: "Broadcasted successfully" };
      // Current implementation saves a DB record for each user:
      return await this.sendToMultipleUsers(userIds, notificationParams);
    } catch (error) {
      logger.error('Error broadcasting notification:', error);
      throw error;
    }
  },

  async getUserNotifications(userId: string, page = 1, limit = 20, unreadOnly = false) {
    const skip = (page - 1) * limit;
    const where: any = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    const [notifications, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async markAsRead(notificationId: string, userId: string) {
    try {
      const result = await prisma.notification.updateMany({
        where: { id: notificationId, userId, read: false },
        data: { read: true },
      });
      if (result.count > 0) {
        await this.decrementUnreadCount(userId);
      }
      return result.count > 0;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  },
  
  async markMultipleAsRead(notificationIds: string[], userId: string) {
    try {
      const result = await prisma.notification.updateMany({
        where: { id: { in: notificationIds }, userId, read: false, },
        data: { read: true },
      });
      if (result.count > 0) {
        await this.decrementUnreadCount(userId, result.count);
      }
      return result.count;
    } catch (error) {
      logger.error('Error marking multiple notifications as read:', error);
      throw error;
    }
  },

  async markAllAsRead(userId: string) {
    try {
      const result = await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
      if (result.count > 0) {
        // Reset count to 0 or re-fetch count for accuracy
        await cacheManager.set(`unread_count:${userId}`, "0", 3600); 
      }
      return result.count;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  async deleteNotification(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId },
      });
      if (!notification) return false;

      await prisma.notification.delete({ where: { id: notificationId } });
      if (!notification.read) {
        await this.decrementUnreadCount(userId);
      }
      return true;
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw error;
    }
  },

  async getUnreadCount(userId: string): Promise<number> {
    const cacheKey = `unread_count:${userId}`;
    try {
      const cachedCountStr = await cacheManager.get<string>(cacheKey);
      if (cachedCountStr !== null) {
        return parseInt(cachedCountStr, 10);
      }
      const count = await prisma.notification.count({
        where: { userId, read: false },
      });
      await cacheManager.set(cacheKey, count.toString(), 3600); 
      return count;
    } catch (error) {
      logger.error('Error getting unread count:', error);
      return 0; 
    }
  },

  async incrementUnreadCount(userId: string, increment = 1) {
    const cacheKey = `unread_count:${userId}`;
    try {
      const currentCount = await this.getUnreadCount(userId); 
      await cacheManager.set(cacheKey, (currentCount + increment).toString(), 3600);
    } catch (error) {
      logger.error('Error incrementing unread count:', error);
    }
  },

  async decrementUnreadCount(userId: string, decrement = 1) {
    const cacheKey = `unread_count:${userId}`;
    try {
      const currentCount = await this.getUnreadCount(userId);
      const newCount = Math.max(0, currentCount - decrement);
      await cacheManager.set(cacheKey, newCount.toString(), 3600);
    } catch (error) {
      logger.error('Error decrementing unread count:', error);
    }
  },
  
  async sendExamNotification(type: 'started' | 'completed' | 'graded', examTitle: string, userId: string, data?: any) {
    const notifications = {
      started: { type: 'EXAM_STARTED', title: '考试开始', message: `您已开始考试：${examTitle}`, priority: 'NORMAL', category: 'exam' },
      completed: { type: 'EXAM_COMPLETED', title: '考试完成', message: `您已完成考试：${examTitle}`, priority: 'HIGH', category: 'exam' },
      graded: { type: 'EXAM_GRADED', title: '成绩发布', message: `您的考试 "${examTitle}" 的成绩已发布。`, priority: 'HIGH', category: 'exam', actionUrl: `/exams/${data?.examId}/result/${data?.recordId || ''}`.replace(/\/$/, '') },
    } as Record<string, CreateNotificationParams>; 
    return this.sendToUser(userId, { ...notifications[type], data });
  },

  async sendLearningNotification(type: 'path_completed' | 'milestone_reached', title: string, userId: string, data?: any) {
    const notifications = {
      path_completed: { type: 'LEARNING_PATH_COMPLETED', title: '学习路径完成', message: `恭喜您完成学习路径：${title}`, priority: 'HIGH', category: 'learning' },
      milestone_reached: { type: 'MILESTONE_REACHED', title: '里程碑达成', message: `您已达成学习里程碑：${title}`, priority: 'NORMAL', category: 'achievement' },
    } as Record<string, CreateNotificationParams>; 
    return this.sendToUser(userId, { ...notifications[type], data });
  },

  async sendSystemNotification(type: 'maintenance' | 'update' | 'announcement', message: string, data?: any) {
    const notifications = {
      maintenance: { type: 'SYSTEM_MAINTENANCE', title: '系统维护通知', message, priority: 'URGENT', category: 'system' },
      update: { type: 'SYSTEM_UPDATE', title: '系统更新', message, priority: 'NORMAL', category: 'system' },
      announcement: { type: 'SYSTEM_ANNOUNCEMENT', title: '系统公告', message, priority: 'NORMAL', category: 'system' },
    } as Record<string, CreateNotificationParams>; 
    return this.broadcast({ ...notifications[type], data });
  },
};
