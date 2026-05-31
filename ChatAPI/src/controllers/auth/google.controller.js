import prisma from '../../config/prisma.js';
import { NotFoundError, AuthenticationError, ConflictError } from '../../middleware/error.middleware.js';
import config from '../../config/index.js';

// Marker stored as passwordHash for accounts that signed up via Google only
// (no email/password set) — these users cannot unlink Google without setting a password
const GOOGLE_ONLY_PASSWORD_MARKER = '__google_oauth_only__';

export class GoogleController {
  /**
   * Handle Google OAuth callback
   * GET /api/auth/google/callback
   */
  async callback(req, res, next) {
    try {
      if (!req.user) {
        return res.redirect(
          `${config.frontendUrl}/login?error=google_auth_failed`
        );
      }

      const { tokens, ...userData } = req.user;

      // Encode user data + tokens in a single-pass base64url token
      const payload = Buffer.from(JSON.stringify({ tokens, user: userData })).toString(
        'base64url'
      );

      return res.redirect(`${config.frontendUrl}/auth/callback?token=${payload}`);
    } catch (error) {
      return res.redirect(`${config.frontendUrl}/login?error=google_auth_failed`);
    }
  }

  /**
   * Initiate Google OAuth flow
   * GET /api/auth/google
   */
  authenticate(req, res, next) {
    next();
  }

  /**
   * Link Google account to currently logged-in user
   * POST /api/auth/google/link
   */
  async linkAccount(req, res, next) {
    try {
      const userId = req.userId;
      const { googleId, googleAccessToken, googleRefreshToken } = req.body;

      if (!googleId) {
        throw new Error('googleId is required');
      }

      // Prevent linking to another user's Google account
      const existingGoogleUser = await prisma.user.findFirst({
        where: { googleId, NOT: { id: userId } },
      });

      if (existingGoogleUser) {
        throw new ConflictError('This Google account is already linked to another user');
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          googleId,
          googleAccessToken: googleAccessToken || null,
          googleRefreshToken: googleRefreshToken || null,
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          status: true,
          isVerified: true,
          googleId: true,
          createdAt: true,
        },
      });

      return res.json({
        success: true,
        data: updatedUser,
        message: 'Google account linked successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unlink Google account from current user
   * DELETE /api/auth/google/unlink
   */
  async unlinkAccount(req, res, next) {
    try {
      const userId = req.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { googleId: true, passwordHash: true },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      if (!user.googleId) {
        throw new AuthenticationError('Google account is not linked');
      }

      // Google-only users cannot unlink without setting a password first
      if (user.passwordHash === GOOGLE_ONLY_PASSWORD_MARKER) {
        throw new AuthenticationError(
          'Cannot unlink: you must set a password first before unlinking Google'
        );
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          googleId: null,
          googleAccessToken: null,
          googleRefreshToken: null,
        },
      });

      return res.json({
        success: true,
        data: null,
        message: 'Google account unlinked successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Google link status for current user
   * GET /api/auth/google/link-status
   */
  async getLinkStatus(req, res, next) {
    try {
      const userId = req.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          googleId: true,
          email: true,
          passwordHash: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      const canUnlink = user.passwordHash !== GOOGLE_ONLY_PASSWORD_MARKER;

      return res.json({
        success: true,
        data: {
          isLinked: !!user.googleId,
          email: user.email,
          canUnlink,
          message: canUnlink
            ? 'You can unlink Google'
            : 'Set a password first to be able to unlink Google',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export { GOOGLE_ONLY_PASSWORD_MARKER };
export default new GoogleController();
