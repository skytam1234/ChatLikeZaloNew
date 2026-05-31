import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, refreshTokenSchema } from '../validators/auth.validator.js';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), authController.register.bind(authController));
router.post('/login', validate(loginSchema), authController.login.bind(authController));
router.post('/refresh', validate(refreshTokenSchema), authController.refresh.bind(authController));
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword.bind(authController));
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword.bind(authController));

// Protected routes
router.get('/me', authenticate, authController.me.bind(authController));
router.put('/me', authenticate, authController.updateProfile.bind(authController));
router.post('/logout', authenticate, authController.logout.bind(authController));
router.post('/change-password', authenticate, authController.changePassword.bind(authController));
router.get('/sessions', authenticate, authController.getSessions.bind(authController));
router.delete('/sessions/:id', authenticate, authController.revokeSession.bind(authController));
router.post('/sessions/revoke-all', authenticate, authController.revokeAllSessions.bind(authController));

export default router;
