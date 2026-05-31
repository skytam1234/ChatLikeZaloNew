import { adminApi } from '@/api/admin.js';
import { format } from '@/utils/formatters.js';

export const adminService = {
  async getUsers(params = {}) {
    const response = await adminApi.getUsers(params);
    // Interceptor unwraps { success, data, pagination } → response.data = array, response.pagination = obj
    const users = (response.data || []).map((user) => ({
      ...user,
      createdAtFormatted: format(user.createdAt),
      lastSeenAtFormatted: format(user.lastSeenAt),
    }));
    return { users, pagination: response.pagination };
  },

  async getUser(id) {
    const response = await adminApi.getUser(id);
    return response.data;
  },

  async updateRole(id, role) {
    const response = await adminApi.updateRole(id, role);
    return response.data;
  },

  async toggleStatus(id, isActive) {
    const response = await adminApi.toggleStatus(id, isActive);
    return response.data;
  },

  async deleteUser(id) {
    const response = await adminApi.deleteUser(id);
    return response.data;
  },

  async getStats() {
    const response = await adminApi.getStats();
    return response.data;
  },
};
