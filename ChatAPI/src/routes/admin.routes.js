import { Router } from 'express';
import adminController from '../controllers/admin.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  getUsersSchema,
  getUserByIdSchema,
  updateRoleBodySchema,
  updateStatusBodySchema,
  deleteUserSchema,
} from '../validators/admin.validator.js';

const router = Router();

// All routes require authentication + admin role
router.use(authenticate);
router.use(requireRole('admin'));

// Dashboard stats
router.get('/stats', adminController.getStats);

// User management
router.get('/users', validate(getUsersSchema, 'query'), adminController.getUsers);
router.get('/users/:id', validate(getUserByIdSchema, 'params'), adminController.getUserById);
router.patch('/users/:id/role',
  validate(getUserByIdSchema, 'params'),
  validate(updateRoleBodySchema),
  adminController.updateUserRole);
router.patch('/users/:id/status',
  validate(getUserByIdSchema, 'params'),
  validate(updateStatusBodySchema),
  adminController.toggleUserStatus);
router.delete('/users/:id', validate(deleteUserSchema, 'params'), adminController.deleteUser);

export default router;


