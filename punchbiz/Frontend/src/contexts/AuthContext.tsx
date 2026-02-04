import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Define our own User type since we are dropping Supabase
export interface User {
  id: string;
  email: string;
  fullName?: string;
  role?: 'admin' | 'staff' | 'viewer' | 'superadmin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any; user?: User }>;
  signIn: (email: string, password: string) => Promise<{ error: any; user?: User }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  verifyOtp: (email: string, otp: string) => Promise<{ error: any }>;
  confirmPasswordReset: (email: string, otp: string, newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token in local storage
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      // Optionally verify token with backend here
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const res = await api.post('/auth/register', {
        email,
        password,
        fullName,
        farmName: 'My Farm' // Default
      });

      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      toast.success('Account created successfully!');
      return { error: null, user };
    } catch (err: any) {
      console.error('Registration error:', err);
      let msg = 'Registration failed';
      if (err.response) {
        msg = err.response.data?.message || 'Registration failed';
      } else if (err.request) {
        msg = 'Cannot connect to server. Please ensure the Backend is running on port 5000.';
      }
      toast.error(msg);
      return { error: { message: msg } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', {
        email,
        password,
      });

      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      toast.success('Welcome back!');
      return { error: null, user };
    } catch (err: any) {
      console.error('Login error:', err);
      let msg = 'Login failed';
      if (err.response) {
        msg = err.response.data?.message || 'Login failed';
      } else if (err.request) {
        msg = 'Cannot connect to server. Please ensure the Backend is running on port 5000.';
      }
      toast.error(msg);
      return { error: { message: msg } };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Signed out successfully');
  };

  const resetPassword = async (email: string) => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      // The message will now contain the OTP if in dev mode
      toast.success(res.data.message || 'OTP sent to your email!');
      return { error: null };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to send OTP';
      toast.error(msg);
      return { error: { message: msg } };
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      await api.post('/auth/verify-otp', { email, otp });
      toast.success('OTP verified!');
      return { error: null };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP';
      toast.error(msg);
      return { error: { message: msg } };
    }
  };

  const confirmPasswordReset = async (email: string, otp: string, newPassword: string) => {
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('Password reset successfully! Please sign in.');
      return { error: null };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to reset password';
      toast.error(msg);
      return { error: { message: msg } };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading: false,
      signUp,
      signIn,
      signOut,
      resetPassword,
      verifyOtp,
      confirmPasswordReset
    }}>
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
