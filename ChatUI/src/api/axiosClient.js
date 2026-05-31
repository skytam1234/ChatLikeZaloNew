import axios from 'axios'
import { storage } from '@/utils/storage.js'
import { getNewAccessToken } from '@/hooks/useTokenRefresh.js'
import { API_URL } from '@/utils/constants.js'

export const axiosClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
})

// Request interceptor
axiosClient.interceptors.request.use(
  (config) => {
    const token = storage.get('ACCESS_TOKEN')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => {
    // Always unwrap data envelope if response has success: true
    if (response.data && response.data.success === true) {
      const { data, pagination } = response.data
      response.data = data
      if (pagination) response.pagination = pagination
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (!originalRequest) {
      return Promise.reject(error)
    }

    // Skip token refresh for auth endpoints (login, register, etc.)
    const isAuthEndpoint = originalRequest.url?.includes('/auth/')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true

      try {
        const newAccessToken = await getNewAccessToken()

        if (!newAccessToken) {
          storage.clear()
          window.location.href = '/login?session=expired'
          return Promise.reject(error)
        }

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        }
        return axiosClient(originalRequest)
      } catch (refreshError) {
        storage.clear()
        window.location.href = '/login?session=expired'
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

/**
 * File upload client (uses multipart/form-data, not JSON)
 */
export const fileClient = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 60000,
  withCredentials: true,
})

fileClient.interceptors.request.use((config) => {
  const token = storage.get('ACCESS_TOKEN')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
