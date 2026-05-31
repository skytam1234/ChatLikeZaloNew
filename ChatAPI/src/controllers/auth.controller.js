import authService from '../services/auth.service.js';
import { successResponse, createdResponse, errorResponse } from '../middleware/response.middleware.js';

export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return createdResponse(res, result, 'Registration successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const deviceInfo = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
      };
      const result = await authService.login(req.body, deviceInfo);
      return successResponse(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      await authService.logout(req.userId, req.token);
      return successResponse(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh token
   * POST /api/auth/refresh
   */
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);
      return successResponse(res, tokens, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   * GET /api/auth/me
   */
  async me(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.userId);
      return successResponse(res, user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Forgot password
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req, res, next) {
    try {
      const result = await authService.forgotPassword(req.body.email);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   * POST /api/auth/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      const result = await authService.resetPassword(token, password);
      return successResponse(res, result, 'Password reset successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user profile
   * PUT /api/auth/me
   */
  async updateProfile(req, res, next) {
    try {
      const user = await authService.updateProfile(req.userId, req.body);
      return successResponse(res, user, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * POST /api/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.userId, currentPassword, newPassword);
      return successResponse(res, result, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all sessions for current user
   * GET /api/auth/sessions
   */
  async getSessions(req, res, next) {
    try {
      const sessions = await authService.getSessions(req.userId, req.token);
      return successResponse(res, sessions);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke a specific session
   * DELETE /api/auth/sessions/:id
   */
  async revokeSession(req, res, next) {
    try {
      const result = await authService.revokeSession(req.userId, req.params.id, req.token);
      return successResponse(res, result, 'Session revoked successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke all sessions except current
   * POST /api/auth/sessions/revoke-all
   */
  async revokeAllSessions(req, res, next) {
    try {
      const result = await authService.revokeAllSessions(req.userId, req.token);
      return successResponse(res, result, 'All other sessions revoked successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
