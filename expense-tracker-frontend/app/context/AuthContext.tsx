'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

import  Cookies from 'js-cookie'

//NEXT_PUBLIC_API_URL = https://finance-fusion-api.vercel.app/api - for deployment
//NEXT_PUBLIC_API_URL = http://localhost:5000/api

// Add cookie options for better security
const COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  expires: 7 // 7 days
};

interface User {
  id: string;
  email: string;
  fullname: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (fullname: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyOTP: (otp: string, email: string) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  resetPassword: (newPassword: string , email: string) => Promise<void>;
  resetVerify: (otp: string, email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Clear any existing tokens and cookies on page load
        if (window.performance && window.performance.navigation.type === window.performance.navigation.TYPE_RELOAD) {
          // Cookies.remove('token');
          // Cookies.remove('user');
          setUser(null);
          router.push('/login');
          return;
        }

        const token = Cookies.get("token");
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await authAPI.getCurrentUser();
        
        if (response.status === 'success' && response.user) {
          const userData: User = {
            id: response.user.id,
            email: response.user.email,
            fullname: response.user.fullname || ''
          };
          setUser(userData);
        } else {
          // Cookies.remove('token');
          // Cookies.remove('user');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Cookies.remove('token');
        // Cookies.remove('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signup = async (fullname: string, email: string, password: string) => {
    try {
      const response = await authAPI.register(fullname, email, password);
      
      if (response.status === 'otp_required') {
        toast({
          title: "Verification Required",
          description: "Please verify your email with OTP to complete registration",
          variant: "default",
        });
        router.push(`/verify-signup?email=${encodeURIComponent(email)}`);
      } else {
        toast({
          title: "Registration Successful",
          description: "Please log in with your credentials",
          variant: "success",
        });
        router.replace('/login');
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Registration failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const verifySignupOTP = async (otp: string, email: string) => {
    try {
      const response = await authAPI.verifySignupOTP(otp, email);
      
      if (response.status === 'success') {
        toast({
          title: "Account Verified",
          description: "Your account has been verified. Please log in.",
          variant: "success",
        });
        router.replace('/login');
      } else {
        toast({
          title: "Verification Failed",
          description: response.message || "Invalid OTP",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "An error occurred during verification",
        variant: "destructive",
      });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      
      if (response.status === 'otp_required') {
        toast({
          title: "Verification Required",
          description: "Please verify your login with OTP",
          variant: "default",
        });
        router.push(`/verify-login?email=${encodeURIComponent(email)}`);
      } else if (response.status === 'success' && response.token) {
        Cookies.set('token', response.token, COOKIE_OPTIONS);
        const userData: User = {
          id: response.user.id,
          email: response.user.email,
          fullname: response.user.fullname || ''
        };
        setUser(userData);
        router.replace('/dashboard');
      } else {
        toast({
          title: "Login Failed",
          description: response.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      });
    }
  };

  const verifyLoginOTP = async (otp: string, email: string) => {
    try {
      const response = await authAPI.verifyLoginOTP(otp, email);
      
      if (response.status === 'success' && response.token && response.user) {
        // Cookies.remove('tempToken');
        Cookies.set('token', response.token, COOKIE_OPTIONS);
        const userData: User = {
          id: response.user.id,
          email: response.user.email,
          fullname: response.user.fullname || ''
        };
        setUser(userData);
        
        toast({
          title: "Login Successful",
          description: "Welcome to your dashboard!",
          variant: "success",
        });

        // Wait for state to update before navigation
        await new Promise(resolve => setTimeout(resolve, 500));
        router.replace('/dashboard');
      } else {
        toast({
          title: "Verification Failed",
          description: response.message || "Invalid OTP",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "An error occurred during verification",
        variant: "destructive",
      });
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      // Cookies.remove('token');
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
        variant: "success",
      });
      router.push('/login');
    } catch (error: any) {
      toast({
        title: "Logout Failed",
        description: error.response?.data?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const verifyOTP = async (otp: string, email: string) => {
    try {
      console.log('Starting OTP verification');
      const response = await authAPI.verifyOTP(otp, email);
      console.log('OTP verification response:', response);
      
      if (response.status === 'success' && response.token && response.user) {
        console.log('OTP verification successful');
        // Cookies.remove('tempToken');
        Cookies.set('token', response.token, COOKIE_OPTIONS);
        console.log('Token stored in Cookies');

        const userData: User = {
          id: response.user.id || '',
          email: response.user.email || '',
          fullname: response.user.fullname || ''
        };
        
        console.log('Setting user state:', userData);
        setUser(userData);
        
        toast({
          title: "Verification Successful",
          description: "Welcome to your dashboard!",
          variant: "success",
        });

        // Wait for state to update before navigation
        console.log('Waiting for state update...');
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('Navigating to dashboard');
        router.replace('/dashboard');
      } else {
        console.log('OTP verification failed:', response);
        toast({
          title: "Verification Failed",
          description: response.message || "Invalid OTP",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "An error occurred during verification",
        variant: "destructive",
      });
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    try {
      await authAPI.sendPasswordResetEmail(email);
      toast({
        title: "Reset Email Sent",
        description: "Please check your email for password reset instructions.",
        variant: "success",
      });
      router.push(`/resetVerify?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.response?.data?.message || "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const resetPassword = async (newPassword: string , email: string) => {
    try {
      await authAPI.resetPassword(newPassword, email);
      toast({
        title: "Password Reset",
        description: "Your password has been reset successfully.",
        variant: "success",
      });
      router.push('/login');
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.response?.data?.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const resetVerify = async (otp: string, email: string) => {
    try {
      const response = await authAPI.verifyOTP(otp, email);
      
      if (response.status === 'success' && response.token && response.user) {
        // Cookies.remove('tempToken');
        Cookies.set('token', response.token, COOKIE_OPTIONS);
        const userData: User = {
          id: response.user.id || '',
          email: response.user.email || '',
          fullname: response.user.fullname || ''
        };
        
        setUser(userData);
        toast({
          title: "OTP Verified",
          description: "Your email has been verified successfully. Please change your password.",
          variant: "success",
        });
        router.push(`/newPassword?email=${encodeURIComponent(email)}`);
      } else {
        toast({
          title: "Verification Failed",
          description: response.message || "Invalid OTP. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Reset verification error:', error);
      toast({
        title: "Verification Failed",
        description: error.response?.data?.message || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    verifyOTP,
    sendPasswordResetEmail,
    resetVerify,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 