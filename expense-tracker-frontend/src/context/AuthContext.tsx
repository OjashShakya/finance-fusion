"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { User, AuthResponse } from "../types/auth";
import Cookies from "js-cookie";
import { useToast } from "@/hooks/use-toast";

export type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  error: string | null;
  otpStep: boolean;
  otpEmail: string;
  otpType: 'signup' | 'login' | '';
  setOtpType: (value: 'signup' | 'login' | '') => void;
  register: (fullname: string, email: string, password: string) => Promise<AuthResponse>;
  verifyOTP: (otp: string) => Promise<AuthResponse>;
  login: (credentials: { email: string; password: string }) => Promise<AuthResponse>;
  logout: () => void;
  setOtpStep: (value: boolean) => void;
  signup: (fullname: string, email: string, password: string) => Promise<AuthResponse>;
  sendPasswordResetEmail: (email: string) => Promise<AuthResponse>;
  resetVerify: (otp: string, email: string) => Promise<AuthResponse>;
  resetPassword: (newPassword: string, email: string) => Promise<AuthResponse>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [otpStep, setOtpStep] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpType, setOtpType] = useState<'signup' | 'login' | ''>("");
  const router = useRouter();
  const { toast } = useToast();

  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === "success") {
        setUser(response.data.user);
        // Store the updated user data in cookies
        Cookies.set("user", JSON.stringify(response.data.user), {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict' as const,
          expires: 7 // 7 days
        });
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = Cookies.get("token");
        const storedUser = Cookies.get("user");
        
        if (token) {
          const isValid = await validateToken(token);
          if (isValid) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            router.push("/dashboard");
          } else {
            // Clear invalid token and user data
            // Cookies.remove("token");
            // Cookies.remove("user");
            delete axios.defaults.headers.common["Authorization"];
            setUser(null);
            router.push("/login");
          }
        } else if (window.location.pathname !== '/login') {
          router.push("/login");
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        // Cookies.remove("token");
        // Cookies.remove("user");
        delete axios.defaults.headers.common["Authorization"];
        setUser(null);
        if (window.location.pathname !== '/login') {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signup = async (fullname: string, email: string, password: string): Promise<AuthResponse> => {
    try {
      setError(null);
      const response = await axios.post(
        "http://localhost:5000/api/users/register",
        { fullname, email, password }
      );

      if (response.data.status === "error") {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }

      if (response.data.status === "otp_required") {
        setOtpStep(true);
        setOtpEmail(email);
        setOtpType("signup");
        Cookies.set("otpEmail", email);
        return { success: true, requiresOTP: true, message: "OTP sent to your email" };
      }

      return { success: true, message: "Registration successful" };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "An error occurred during registration";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const login = async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    try {
      setError(null);
      const response = await axios.post(
        "http://localhost:5000/api/users/login",
        credentials
      );

      if (response.data.status === "error") {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }

      if (response.data.status === "otp_required") {
        setOtpStep(true);
        setOtpEmail(credentials.email);
        setOtpType("login");
        Cookies.set("otpEmail", credentials.email);
        return { success: true, requiresOTP: true, message: "OTP sent to your email" };
      }

      const { token, user } = response.data;
      Cookies.set("token", token, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        expires: 7 // 7 days
      });
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(user);
      Cookies.set("user", JSON.stringify(user));
      router.push("/dashboard");
      return { success: true, message: "Login successful" };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "An error occurred during login";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const verifyOTP = async (otp: string): Promise<AuthResponse> => {
    try {
      setError(null);
      const email = Cookies.get("otpEmail");
      if (!email) {
        setError("Email not found");
        return { success: false, message: "Email not found" };
      }

      const endpoint = otpType === "login" ? "verify-login-otp" : "verify-otp";

      console.log("Endpoint::", endpoint)

      const response = await axios.post(
        `http://localhost:5000/api/users/${endpoint}`,
        { email, otp }
      );

      if (response.data.status === "error") {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }

      if (otpType === "login") {
        console.log("Login")
        const { token, user } = response.data;
        Cookies.set("token", token, {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict' as const,
          expires: 7 // 7 days
        });
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setUser(user);
        Cookies.set("user", JSON.stringify(user));
        setOtpStep(false);
        setOtpType("");
        // Cookies.remove("otpEmail");
        router.push("/dashboard");
        return { success: true, message: "Login successful" };
      } else {
        console.log("Sign UP ")
        // Cookies.remove("otpEmail");
        setOtpStep(false);
        setOtpType("");
        router.push("/dashboard");
        return { success: true, message: "OTP verified successfully" };
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "An error occurred during verification";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    // Cookies.remove("token");
    // Cookies.remove("user");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    router.push("/login");
  };

  const sendPasswordResetEmail = async (email: string): Promise<AuthResponse> => {
    try {
      setError(null);
      const response = await axios.post(
        "http://localhost:5000/api/users/password-reset/request",
        { email }
      );

      if (response.data.status === "error") {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }

      return { success: true, message: "Password reset email sent successfully" };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to send reset email";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const resetVerify = async (otp: string, email: string): Promise<AuthResponse> => {
    try {
      setError(null);
      const response = await axios.post(
        "http://localhost:5000/api/users/verify-otp",
        { email, otp }
      );

      if (response.data.status === "error") {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }

      if (response.data.status === "success") {
        return { success: true, message: "OTP verified successfully" };
      }

      return { success: false, message: "Verification failed" };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "An error occurred during verification";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const resetPassword = async (newPassword: string, email: string): Promise<AuthResponse> => {
    try {
      setError(null);
      const response = await axios.post(
        "http://localhost:5000/api/users/password-reset/reset",
        { newPassword, email }
      );

      if (response.data.success === false) {
        setError(response.data.message);
        toast({
          title: "Password Reset Failed",
          description: response.data.message,
          variant: "destructive",
        });
        return { success: false, message: response.data.message };
      }

      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset successfully. Please login with your new password.",
        variant: "success",
      });
      return { success: true, message: "Password reset successfully" };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to reset password";
      setError(errorMessage);
      toast({
        title: "Password Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, message: errorMessage };
    }
  };

  const value = {
    user,
    loading,
    error,
    otpStep,
    otpEmail,
    otpType,
    setOtpType,
    register: signup,
    verifyOTP,
    login,
    logout,
    setOtpStep,
    signup,
    sendPasswordResetEmail,
    resetVerify,
    resetPassword,
    setUser,
    isAuthenticated: !!user,
    isLoading: loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}; 