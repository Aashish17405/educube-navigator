import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

// Token validation function
export const validateToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
    return Date.now() < expirationTime;
  } catch (error) {
    return false;
  }
};

// Upload image to server
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.url;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

export const courseService = {
  // Get all courses (different behavior for learners and instructors)
  getCourses: async () => {
    const response = await api.get('/courses');
    return response.data;
  },

  // Get course details with student progress (instructors only)
  getCourseProgress: async (courseId: string) => {
    const response = await api.get(`/courses/${courseId}/progress`);
    return response.data;
  },

  // Create a new course (instructors only)
  createCourse: async (courseData: any) => {
    const response = await api.post('/courses', courseData);
    return response.data;
  },

  // Enroll in a course (learners only)
  enrollInCourse: async (courseId: string) => {
    const response = await api.post(`/courses/${courseId}/enroll`);
    return response.data;
  },

  // Update course progress (learners only)
  updateProgress: async (courseId: string, progressData: any) => {
    const response = await api.put(`/courses/${courseId}/progress`, progressData);
    return response.data;
  }
};

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: { 
    username: string; 
    email: string; 
    password: string; 
    role: string 
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  }
};

export default api;
