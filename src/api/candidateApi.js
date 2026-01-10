import axiosInstance from './axiosInstance';

export const candidateApi = {
  // Allow-list management (own candidate)
  getAllowList: async () => {
    const response = await axiosInstance.get('/api/candidate/allow-list');
    return response.data;
  },
  
  addToAllowList: async (data) => {
    const response = await axiosInstance.post('/api/candidate/allow-list', data);
    return response.data;
  },
  
  removeFromAllowList: async (allowListId) => {
    const response = await axiosInstance.delete(`/api/candidate/allow-list/${allowListId}`);
    return response.data;
  },
  
  // Candidate users (own candidate)
  getCandidateUsers: async () => {
    const response = await axiosInstance.get('/api/candidate/users');
    return response.data;
  },
  
  createCandidateUser: async (data) => {
    const response = await axiosInstance.post('/api/candidate/users', data);
    return response.data;
  },
  
  // Usage summary (own candidate)
  getUsageSummary: async () => {
    const response = await axiosInstance.get('/api/candidate/usage');
    return response.data;
  },
};

