import axiosInstance from './axiosInstance';

export const authApi = {
  login: async (username, password) => {
    const response = await axiosInstance.post('/api/auth/login', {
      username,
      password,
    });
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

