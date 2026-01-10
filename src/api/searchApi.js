import axiosInstance from './axiosInstance';

export const searchApi = {
  searchByEpic: async (payload) => {
    const response = await axiosInstance.post('/api/search/epic', payload);
    return response.data;
  },
  
  searchByName: async (payload) => {
    const response = await axiosInstance.post('/api/search/name', payload);
    return response.data;
  },
};
