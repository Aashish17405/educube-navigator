import axios from 'axios';

// Use the environment variable or a fallback URL
export const API_URL = process.env.BACKEND_API_URL || 'https://educube-navigator.onrender.com/api';


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
    // Don't override Content-Type for multipart/form-data
    if (config.headers['Content-Type'] === 'multipart/form-data') {
      delete config.headers['Content-Type'];
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

  // Get a specific course by ID
  getCourseById: async (courseId: string) => {
    const response = await api.get(`/courses/${courseId}`);
    return response.data;
  },

  // Get user's enrolled courses
  getEnrolledCourses: async () => {
    const response = await api.get('/enrollments/dashboard');
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

  // Delete a course (instructors only)
  deleteCourse: async (courseId: string) => {
    const response = await api.delete(`/courses/${courseId}`);
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

export const enrollmentService = {
  // Enroll in a course
  enrollInCourse: async (courseId: string) => {
    const response = await api.post(`/enrollments/${courseId}/enroll`);
    return response.data;
  },

  // Get all enrollments for dashboard
  getEnrollments: async () => {
    const response = await api.get('/enrollments/dashboard');
    return response.data;
  },

  // Get enrollment status for a course
  getEnrollmentStatus: async (courseId: string) => {
    const response = await api.get(`/enrollments/${courseId}/status`);
    return response.data;
  },

  // Update lesson progress
  updateProgress: async (courseId: string, progressData: any) => {
    const response = await api.post(`/enrollments/${courseId}/progress`, progressData);
    return response.data;
  },

  // Mark resource as completed
  completeResource: async (courseId: string, resourceData: any) => {
    const response = await api.post(`/enrollments/${courseId}/resource-complete`, resourceData);
    return response.data;
  },

  // Mark entire course as completed
  completeCourse: async (courseId: string) => {
    const response = await api.post(`/enrollments/${courseId}/complete`);
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

export const uploadService = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  downloadFile: async (fileId: string) => {
    const response = await api.get(`/uploads/file/${fileId}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  deleteFile: async (publicId: string) => {
    const response = await api.delete(`/uploads/${publicId}`);
    return response.data;
  }
};

export default api;
