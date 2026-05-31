import { axiosClient } from './axiosClient.js'

export const callApi = {
  /**
   * Get call history for the current user
   * @param {Object} params
   * @param {number} params.page
   * @param {number} params.limit
   * @param {'all'|'missed'|'answered'} params.filter
   */
  getCallHistory: (params = {}) => {
    return axiosClient.get('/calls/history', { params })
  },

  /**
   * Get call details
   * @param {string} callId
   */
  getCall: (callId) => {
    return axiosClient.get(`/calls/${callId}`)
  },
}

export default callApi
