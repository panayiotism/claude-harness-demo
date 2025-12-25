import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor to unwrap { data, success } wrapper and handle errors
api.interceptors.response.use(
  (response) => {
    // Backend wraps responses in { data: ..., success: true }
    // Unwrap to return just the data
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default api;
