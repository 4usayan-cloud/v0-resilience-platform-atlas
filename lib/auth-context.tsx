"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  username: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default credentials - In production, these should be stored securely in environment variables
// and validated against a database
const VALID_CREDENTIALS = [
  { username: 'admin', password: 'atlas2025', role: 'admin' as const },
  { username: 'sayan', password: 'resilience@123', role: 'admin' as const },
  { username: 'user', password: 'viewer2025', role: 'user' as const },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  // Default to authenticated as guest user for public access
  const [user, setUser] = useState<User | null>({ username: 'guest', role: 'user' });
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem('atlas_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        sessionStorage.removeItem('atlas_user');
        // Keep default guest user if storage fails
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const validUser = VALID_CREDENTIALS.find(
      cred => cred.username.toLowerCase() === username.toLowerCase() && cred.password === password
    );

    if (validUser) {
      const userData: User = { username: validUser.username, role: validUser.role };
      setUser(userData);
      sessionStorage.setItem('atlas_user', JSON.stringify(userData));
      return { success: true };
    }

    return { success: false, error: 'Invalid username or password' };
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('atlas_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    if (typeof window !== 'undefined') {
      console.warn('useAuth used outside AuthProvider; falling back to unauthenticated state.');
    }
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => ({ success: false, error: 'AuthProvider missing' }),
      logout: () => {},
    } as AuthContextType;
  }
  return context;
}
