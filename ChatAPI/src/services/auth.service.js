import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/index.js';
import prisma from '../config/prisma.js';
import { generateTokens, getTokenExpiration, verifyToken } from '../utils/jwt.js';
import { NotFoundError, AuthenticationError, ConflictError, ValidationError } from '../middleware/error.middleware.js';
import queueService from './queue.service.js';
import socketService from '../socket/services/socket.service.js';
import { SOCKET_EVENTS } from '../socket/events.js';
import notificationService from './notification.service.js';

export class AuthService {
  /**
   * Register a new user
   */
  async register({ username, email, password, displayName, phoneNumber }) {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictError('Email already registered');
      }
      throw new ConflictError('Username already taken');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        username,
        email,
        passwordHash,
        displayName,
        phoneNumber,
        isVerified: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        status: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // Broadcast new user notification to all existing users
    const notificationPayload = {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    };

    // Save notifications to DB for all existing users
    await notificationService.createBulkNotifications({
      excludeUserId: user.id,
      type: 'system',
      title: 'Người dùng mới',
      content: `${user.displayName} đã tham gia hệ thống`,
      metadata: notificationPayload,
    });

    // Emit real-time event to all online users
    if (socketService.io) {
      socketService.io.to('user_announcement').emit(SOCKET_EVENTS.USER_JOINED, {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      user,
    };
  }
  async login({ email, password }, deviceInfo = {}) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is disabled');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Generate tokens
    const tokens = generateTokens(user.id, user.role ?? 'user');

    // Create session
    await this.createSession(user.id, tokens, deviceInfo);

    // Update user status
    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'online', lastSeenAt: new Date() },
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        status: 'online',
        isVerified: user.isVerified,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * Logout user
   */
  async logout(userId, token) {
    // Find and deactivate session
    await prisma.session.updateMany({
      where: { userId, token, isActive: true },
      data: { isActive: false },
    });

    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'offline', lastSeenAt: new Date() },
    });

    return true;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    // Verify refresh token
    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch (error) {
      throw new AuthenticationError('Invalid refresh token');
    }

    if (decoded.type !== 'refresh') {
      throw new AuthenticationError('Invalid token type');
    }

    // Find active session
    const session = await prisma.session.findFirst({
      where: {
        refreshToken,
        userId: decoded.userId,
        isActive: true,
      },
    });

    if (!session) {
      throw new AuthenticationError('Session expired or invalid');
    }

    // Check if refresh token is expired
    if (session.refreshExpiresAt && session.refreshExpiresAt < new Date()) {
      await prisma.session.update({
        where: { id: session.id },
        data: { isActive: false },
      });
      throw new AuthenticationError('Refresh token expired');
    }

    // Generate new tokens
    const userForRole = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });
    const tokens = generateTokens(decoded.userId, userForRole?.role ?? 'user');

    // Update session
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: getTokenExpiration(config.jwtExpiresIn),
        refreshExpiresAt: getTokenExpiration(config.jwtRefreshExpiresIn),
      },
    });

    return tokens;
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId) {
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
        lastSeenAt: true,
        isVerified: true,
        createdAt: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  /**
   * Create session
   */
  async createSession(userId, tokens, deviceInfo = {}) {
    const expiresAt = getTokenExpiration(config.jwtExpiresIn);
    const refreshExpiresAt = getTokenExpiration(config.jwtRefreshExpiresIn);

    await prisma.session.create({
      data: {
        id: uuidv4(),
        userId,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
        refreshExpiresAt,
        deviceInfo: JSON.stringify(deviceInfo.deviceInfo || {}),
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
      },
    });
  }

  /**
   * Forgot password
   */
  async forgotPassword(email) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If email exists, reset link has been sent' };
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiresAt: resetTokenExpires,
      },
    });

    // Send password reset email
    await queueService.enqueue('sendPasswordResetEmail', {
      email,
      resetToken,
      userName: user.displayName || user.username,
    });

    return { message: 'If email exists, reset link has been sent' };
  }

  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw new AuthenticationError('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, config.bcryptRounds);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    });

    // Invalidate all sessions
    await prisma.session.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });

    return { message: 'Password reset successful' };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, data) {
    const { displayName, phoneNumber, avatarUrl } = data;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        phoneNumber: true,
        status: true,
        lastSeenAt: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    if (!user.passwordHash) {
      throw new ValidationError('Cannot change password for this account type');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthenticationError('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, config.bcryptRounds);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * Get all sessions for user
   */
  async getSessions(userId, currentToken) {
    const sessions = await prisma.session.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        userAgent: true,
        expiresAt: true,
        createdAt: true,
        token: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((session) => ({
      id: session.id,
      deviceInfo: session.deviceInfo ? JSON.parse(session.deviceInfo) : {},
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      isCurrent: session.token === currentToken,
    }));
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(userId, sessionId, currentToken) {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId, isActive: true },
    });

    if (!session) {
      throw new NotFoundError('Session');
    }

    // Cannot revoke current session through this endpoint
    if (session.token === currentToken) {
      throw new ValidationError('Cannot revoke current session. Use logout instead.');
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false },
    });

    return { message: 'Session revoked successfully' };
  }

  /**
   * Revoke all sessions except current
   */
  async revokeAllSessions(userId, currentToken) {
    const result = await prisma.session.updateMany({
      where: {
        userId,
        isActive: true,
        token: { not: currentToken },
      },
      data: { isActive: false },
    });

    return { message: `${result.count} session(s) revoked successfully` };
  }
}

export default new AuthService();
