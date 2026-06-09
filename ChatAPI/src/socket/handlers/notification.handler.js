import { SOCKET_EVENTS } from '../events.js';
import notificationService from '../../services/notification.service.js';

export async function handleGetNotifications(socket, data) {
  const { page = 1, limit = 20 } = data || {};
  const result = await notificationService.getNotificationsByUser(socket.userId, { page, limit });
  socket.emit(SOCKET_EVENTS.NOTIFICATION_LIST, result);
}

export async function handleMarkNotificationsRead(socket) {
  await notificationService.markAllAsRead(socket.userId);
  socket.emit(SOCKET_EVENTS.NOTIFICATION_READ, { success: true, unreadCount: 0 });
}
