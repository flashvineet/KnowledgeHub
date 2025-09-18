import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on app load
    const token = localStorage.getItem('token');
    if (token) {
      // TODO: Validate token with backend and set user
      // For now, mock validation
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('token'); 
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // TODO: Replace with actual API call to your backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        toast({ title: 'Success', description: 'Logged in successfully!' });
        return true;
      } else {
        const error = await response.json();
        toast({ 
          title: 'Login Failed', 
          description: error.message || 'Invalid credentials',
          variant: 'destructive' 
        });
        return false;
      }
    } catch (error) {
      toast({ 
        title: 'Login Failed', 
        description: 'Network error. Please try again.',
        variant: 'destructive' 
      });
      return false;
    }
  };

  const register = async (email: string, password: string): Promise<boolean> => {
    try {
      // TODO: Replace with actual API call to your backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Account created successfully! Please log in.' });
        return true;
      } else {
        const error = await response.json();
        toast({ 
          title: 'Registration Failed', 
          description: error.message || 'Unable to create account',
          variant: 'destructive' 
        });
        return false;
      }
    } catch (error) {
      toast({ 
        title: 'Registration Failed', 
        description: 'Network error. Please try again.',
        variant: 'destructive' 
      });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast({ title: 'Logged out', description: 'See you next time!' });
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};