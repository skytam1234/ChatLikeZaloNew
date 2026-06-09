import prisma from '../config/prisma.js';

class NotificationService {
  async createNotification({ userId, type, title, content, metadata }) {
    return await prisma.notification.create({
      data: { userId, type, title, content, metadata: metadata || undefined },
    });
  }

  async createBulkNotifications({ excludeUserId, type, title, content, metadata }) {
    const allUsers = await prisma.user.findMany({
      where: { id: { not: excludeUserId } },
      select: { id: true },
    });

    return await prisma.notification.createMany({
      data: allUsers.map((u) => ({
        userId: u.id,
        type,
        title,
        content,
        metadata: metadata || undefined,
      })),
    });
  }

  async getNotificationsByUser(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);
    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markAllAsRead(userId) {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
  async deleteReadNotificationsOlderThanDays(days = 3) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: cutoffDate },
      },
    });
  }

  async getUnreadCount(userId) {
    return await prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}

export default new NotificationService();
