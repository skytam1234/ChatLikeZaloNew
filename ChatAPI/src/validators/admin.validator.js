import { z } from 'zod';

const VALID_ROLES = ['user', 'admin'];

export const getUsersSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().max(100).optional().default(''),
  role: z.enum(['user', 'admin', '']).optional().default(''),
  status: z.enum(['active', 'inactive', '']).optional().default(''),
});

export const getUserByIdSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

export const updateRoleBodySchema = z.object({
  role: z.enum(VALID_ROLES, { required_error: 'Role is required' }),
});

export const updateStatusBodySchema = z.object({
  isActive: z.boolean({ required_error: 'isActive is required' }),
});

export const deleteUserSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});
