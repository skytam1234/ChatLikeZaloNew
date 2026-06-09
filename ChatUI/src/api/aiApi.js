import { axiosClient } from './index.js';

export const aiApi = {
  translate: async (text) => {
    const response = await axiosClient.post('/ai/translate', { text });
    return response.data;
  },
};

export default aiApi;
