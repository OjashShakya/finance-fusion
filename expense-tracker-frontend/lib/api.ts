import axios from 'axios';

import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://finance-fusion-api.vercel.app/api';
// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle 401/403 errors for non-auth endpoints
    if (error.response?.status === 401 || error.response?.status === 403) {
      const url = error.config?.url || '';
      if (!url.includes('/users/login') && !url.includes('/users/verify-otp')) {
        // Cookies.remove('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (fullname: string, email: string, password: string) => {
    try {
      const response = await api.post('/users/register', { fullname, email, password });
      
      if (response.data.requiresOTP) {
        return {
          status: 'otp_required',
          email: email,
          message: 'Please verify your email with OTP to complete registration'
        };
      }

      return response.data;
    } catch (error: any) {
      return {
        status: 'error',
        message: error.response?.data?.message || 'Registration failed',
        error: 'REGISTRATION_FAILED'
      };
    }
  },

  verifySignupOTP: async (otp: string, email: string) => {
    try {
      const response = await api.post('/users/verify-signup-otp', { otp, email });
      
      if (response.data.token) {
        return {
          status: 'success',
          message: 'Account verified successfully. Please log in.',
          email: email
        };
      }

      return {
        status: 'error',
        message: response.data.message || 'Invalid OTP',
        error: 'INVALID_OTP'
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: error.response?.data?.message || 'Verification failed',
        error: 'VERIFICATION_FAILED'
      };
    }
  },

  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/users/login', { email, password });
      
      if (response.data.requiresOTP) {
        return {
          status: 'otp_required',
          email: email,
          message: 'Please verify your login with OTP'
        };
      }

      if (response.data.token) {
        return {
          status: 'success',
          token: response.data.token,
          user: response.data.user
        };
      }

      return {
        status: 'error',
        message: 'Invalid response from server',
        error: 'INVALID_RESPONSE'
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: error.response?.data?.message || 'Login failed',
        error: 'LOGIN_FAILED'
      };
    }
  },

  verifyLoginOTP: async (otp: string, email: string) => {
    try {
      const response = await api.post('/users/verify-login-otp', { otp, email });
      
      if (response.data.token && response.data.user) {
        return {
          status: 'success',
          token: response.data.token,
          user: response.data.user
        };
      }

      return {
        status: 'error',
        message: response.data.message || 'Invalid OTP',
        error: 'INVALID_OTP'
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: error.response?.data?.message || 'Verification failed',
        error: 'VERIFICATION_FAILED'
      };
    }
  },

  verifyOTP: async (otp: string, email: string) => {
    try {
      console.log('Verifying OTP...', { email, otpLength: otp.length });
      
      // Validate OTP format
      if (!otp || otp.length !== 6) {
        return {
          status: 'error',
          message: 'Invalid OTP format. OTP must be 6 digits.',
          error: 'INVALID_OTP_FORMAT'
        };
      }

      const response = await api.post('/users/verify-otp', { otp, email });
      
      if (!response || !response.data) {
        return {
          status: 'error',
          message: 'Invalid response from server',
          error: 'INVALID_RESPONSE'
        };
      }

      // Log the response for debugging
      console.log('OTP verification response:', response.data);

      // Handle 500 error from backend
      if (response.status === 500) {
        console.error('Server error:', response.data);
        return {
          status: 'error',
          message: 'Server error occurred',
          error: 'SERVER_ERROR'
        };
      }

      // Check for successful verification
      if (response.data.token) {
        // Store token immediately
        Cookies.set('token', response.data.token, {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict' as const,
          expires: 7 // 7 days
        });
        
        return {
          status: 'success',
          token: response.data.token,
          user: {
            id: response.data.user?.id || '',
            email: email,
            fullname: response.data.user?.fullname || ''
          }
        };
      }
      
      return {
        status: 'error',
        message: response.data.message || 'Invalid OTP',
        error: 'INVALID_OTP'
      };
    } catch (error: any) {
      console.error('OTP verification error:', error);
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        // Log the error response for debugging
        console.error('Error response:', {
          status,
          data,
          headers: error.response.headers
        });

        return {
          status: 'error',
          message: data?.message || 'Verification failed',
          error: status === 400 ? 'INVALID_OTP' :
                 status === 401 ? 'UNAUTHORIZED' :
                 status === 403 ? 'FORBIDDEN' :
                 status === 500 ? 'SERVER_ERROR' : 'UNKNOWN_ERROR'
        };
      }

      return {
        status: 'error',
        message: error.message || 'An unexpected error occurred',
        error: 'UNKNOWN_ERROR'
      };
    }
  },

  getCurrentUser: async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        return {
          status: 'error',
          message: 'No authentication token found',
          error: 'NO_TOKEN'
        };
      }

      const response = await api.get('/users/me');
      
      if (!response || !response.data) {
        return {
          status: 'error',
          message: 'Invalid response from server',
          error: 'INVALID_RESPONSE'
        };
      }

      if (response.data.user) {
        return {
          status: 'success',
          user: response.data.user
        };
      }

      return {
        status: 'error',
        message: 'User data not found',
        error: 'USER_NOT_FOUND'
      };
    } catch (error: any) {
      console.error('Get current user error:', error);
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 401 || status === 403) {
          // Cookies.remove('token');
        }

        return {
          status: 'error',
          message: data?.message || 'Authentication failed',
          error: status === 401 ? 'UNAUTHORIZED' :
                 status === 403 ? 'FORBIDDEN' :
                 status === 500 ? 'SERVER_ERROR' : 'UNKNOWN_ERROR'
        };
      }

      return {
        status: 'error',
        message: 'An unexpected error occurred',
        error: 'UNKNOWN_ERROR'
      };
    }
  },

  logout: () => {
    // Cookies.remove('token');
  },

  sendPasswordResetEmail: async (email: string) => {
    const response = await api.post('/users/password-reset/request', { email });
    return response.data;
  },

  resetPassword: async (newPassword: string, email: string) => {
    const response = await api.post('/users/password-reset/reset', { newPassword, email });
    return response.data;
  },
};

export const profileAPI = {
  updateUsername: async (userId: string, newUsername: string) => {
    try {
      const response = await api.patch(`/profile/update-username/${userId}`, { newUsername });
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update username'
      };
    }
  },

  updatePassword: async (userId: string, currentPassword: string, newPassword: string) => {
    try {
      const response = await api.patch(`/profile/update-password/${userId}`, {
        currentPassword,
        newPassword
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update password'
      };
    }
  },

  uploadProfilePicture: async (userId: string, file: File | null) => {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      const formData = new FormData();
      formData.append('profilePicture', file); // Changed back to profilePicture to match backend

      // Create a new axios instance for this request to avoid header conflicts
      const uploadApi = axios.create({
        baseURL: API_URL,
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${Cookies.get('token')}`,
          'Accept': 'application/json',
        },
      });

      const response = await uploadApi.post(`/profile/upload-picture/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Profile picture upload error:', error.response?.data || error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to upload profile picture'
      };
    }
  },

  removeProfilePicture: async (userId: string) => {
    try {
      const response = await api.delete(`/profile/remove-picture/${userId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to remove profile picture'
      };
    }
  }
};

export default api; 