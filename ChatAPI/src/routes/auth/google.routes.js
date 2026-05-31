import { Router } from 'express';
import passport from 'passport';
import googleController from '../../controllers/auth/google.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

/**
 * Initiate Google OAuth flow
 * GET /api/auth/google
 */
router.get(
  '/',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

/**
 * Google OAuth callback
 * GET /api/auth/google/callback
 */
router.get(
  '/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`,
    session: false,
  }),
  googleController.callback.bind(googleController)
);

/**
 * Link Google account to current user account
 * POST /api/auth/google/link
 */
router.post(
  '/link',
  authenticate,
  googleController.linkAccount.bind(googleController)
);

/**
 * Unlink Google account from current user account
 * DELETE /api/auth/google/unlink
 */
router.delete(
  '/unlink',
  authenticate,
  googleController.unlinkAccount.bind(googleController)
);

/**
 * Get Google link status
 * GET /api/auth/google/link-status
 */
router.get(
  '/link-status',
  authenticate,
  googleController.getLinkStatus.bind(googleController)
);

export default router;
