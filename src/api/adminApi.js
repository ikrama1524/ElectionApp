import axiosInstance from './axiosInstance';

export const adminApi = {
  // Candidate CRUD
  getCandidates: async () => {
    const response = await axiosInstance.get('/api/admin/candidates');
    return response.data;
  },
  
  getCandidate: async (candidateId) => {
    const response = await axiosInstance.get(`/api/admin/candidates/${candidateId}`);
    return response.data;
  },
  
  createCandidate: async (data) => {
    const response = await axiosInstance.post('/api/admin/candidates', data);
    return response.data;
  },
  
  updateCandidate: async (candidateId, data) => {
    const response = await axiosInstance.put(`/api/admin/candidates/${candidateId}`, data);
    return response.data;
  },
  
  deleteCandidate: async (candidateId) => {
    const response = await axiosInstance.delete(`/api/admin/candidates/${candidateId}`);
    return response.data;
  },
  
  // Prabhag Assignment
  getAssignedPrabhags: async (candidateId) => {
    const response = await axiosInstance.get(`/api/admin/candidates/${candidateId}/prabhag`);
    return response.data;
  },
  
  assignPrabhags: async (candidateId, prabhags) => {
    const response = await axiosInstance.post(`/api/admin/candidates/${candidateId}/prabhag`, {
      prabhags: prabhags,
    });
    return response.data;
  },
  
  removePrabhag: async (candidateId, prabhag) => {
    const response = await axiosInstance.delete(`/api/admin/candidates/${candidateId}/prabhag/${prabhag}`);
    return response.data;
  },
  
  // Allow-list Management (Candidate-scoped - requires prabhag per Swagger)
  getAllowList: async (candidateId, prabhag) => {
    const response = await axiosInstance.get(`/api/candidate/${candidateId}/prabhag/${prabhag}/allowlist`);
    return response.data;
  },
  
  addToAllowList: async (candidateId, prabhag, phoneNumber) => {
    const response = await axiosInstance.post(`/api/candidate/${candidateId}/prabhag/${prabhag}/allowlist`, {
      phoneNumber: phoneNumber,
    });
    return response.data;
  },
  
  deleteFromAllowList: async (candidateId, prabhag, mobile) => {
    const response = await axiosInstance.delete(`/api/candidate/${candidateId}/prabhag/${prabhag}/allowlist/${mobile}`);
    return response.data;
  },
  
  blockMobile: async (candidateId, prabhag, mobile) => {
    const response = await axiosInstance.put(`/api/candidate/${candidateId}/prabhag/${prabhag}/allowlist/${mobile}/block`);
    return response.data;
  },
  
  unblockMobile: async (candidateId, prabhag, mobile) => {
    const response = await axiosInstance.put(`/api/candidate/${candidateId}/prabhag/${prabhag}/allowlist/${mobile}/unblock`);
    return response.data;
  },
  
  // Candidate Users
  getCandidateUsers: async (candidateId) => {
    const response = await axiosInstance.get(`/api/candidate/${candidateId}/users`);
    return response.data;
  },
  
  createCandidateUser: async (candidateId, data) => {
    const response = await axiosInstance.post(`/api/candidate/${candidateId}/users`, data);
    return response.data;
  },
  
  blockUser: async (candidateId, userId) => {
    const response = await axiosInstance.put(`/api/candidate/${candidateId}/users/${userId}/block`);
    return response.data;
  },
  
  // Usage Summary
  getUsageSummary: async (candidateId) => {
    const response = await axiosInstance.get(`/api/candidate/${candidateId}/usage`);
    return response.data;
  },
  
  getUsageByPrabhag: async (candidateId, prabhag) => {
    const response = await axiosInstance.get(`/api/candidate/${candidateId}/prabhag/${prabhag}/usage`);
    return response.data;
  },
  
  // CSV Import
  importCsv: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post('/api/import/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  deleteImport: async (importId) => {
    const response = await axiosInstance.delete(`/api/delete/${importId}`);
    return response.data;
  },
  
  deleteAllImports: async () => {
    const response = await axiosInstance.delete('/api/delete/all');
    return response.data;
  },
};
