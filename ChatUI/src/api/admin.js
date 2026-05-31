import { axiosClient } from './axiosClient.js';

export const adminApi = {
  getUsers: async (params = {}) => {
    const response = await axiosClient.get('/admin/users', { params });
    return response;
  },

  getUser: async (id) => {
    const response = await axiosClient.get(`/admin/users/${id}`);
    return response;
  },

  updateRole: async (id, role) => {
    const response = await axiosClient.patch(`/admin/users/${id}/role`, { role });
    return response;
  },

  toggleStatus: async (id, isActive) => {
    const response = await axiosClient.patch(`/admin/users/${id}/status`, { isActive });
    return response;
  },

  deleteUser: async (id) => {
    const response = await axiosClient.delete(`/admin/users/${id}`);
    return response;
  },

  getStats: async () => {
    const response = await axiosClient.get('/admin/stats');
    return response;
  },
};
