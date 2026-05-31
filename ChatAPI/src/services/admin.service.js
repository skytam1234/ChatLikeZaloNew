import prisma from '../config/prisma.js';
import { NotFoundError, ValidationError, AuthorizationError } from '../middleware/error.middleware.js';

const VALID_ROLES = ['user', 'admin'];

export class AdminService {
  /**
   * Get paginated list of users
   */
  async getUsers({ page = 1, limit = 20, search = '', role = '', status = '' }) {
    const skip = (page - 1) * limit;

    const where = {};

    if (search) {
      where.OR = [
        { displayName: { contains: search } },
        { email: { contains: search } },
        { username: { contains: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          status: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          lastSeenAt: true,
          _count: {
            select: {
              sentMessages: true,
              conversationUsers: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single user by ID
   */
  async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        phoneNumber: true,
        status: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        lastSeenAt: true,
        _count: {
          select: {
            sentMessages: true,
            conversationUsers: true,
            sessions: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  /**
   * Update user role
   */
  async updateUserRole(targetUserId, newRole, requestingAdminId) {
    if (!VALID_ROLES.includes(newRole)) {
      throw new ValidationError(`Role must be one of: ${VALID_ROLES.join(', ')}`);
    }

    if (targetUserId === requestingAdminId) {
      throw new ValidationError('Cannot change your own role');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      throw new NotFoundError('User');
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
      },
    });

    return updated;
  }

  /**
   * Toggle user active status
   */
  async toggleUserStatus(targetUserId, isActive, requestingAdminId) {
    if (targetUserId === requestingAdminId) {
      throw new ValidationError('Cannot deactivate your own account');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      throw new NotFoundError('User');
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        isActive,
        status: isActive ? 'offline' : 'offline',
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
      },
    });

    return updated;
  }

  /**
   * Delete user (soft-delete by deactivating)
   */
  async deleteUser(targetUserId, requestingAdminId) {
    if (targetUserId === requestingAdminId) {
      throw new ValidationError('Cannot delete your own account');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      throw new NotFoundError('User');
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: false, status: 'offline' },
    });

    // Revoke all sessions
    await prisma.session.updateMany({
      where: { userId: targetUserId },
      data: { isActive: false },
    });

    return { message: 'User deleted successfully' };
  }

  /**
   * Get dashboard statistics
   */
  async getStats() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      adminCount,
      newUsers7Days,
      verifiedUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'online' } }),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { isVerified: true } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      adminCount,
      newUsers7Days,
      verifiedUsers,
    };
  }
}

export default new AdminService();
