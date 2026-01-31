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

// Single-login credentials (client-side). Set NEXT_PUBLIC_ADMIN_USER / NEXT_PUBLIC_ADMIN_PASS on Vercel.
const VALID_CREDENTIAL = {
  username: (process.env.NEXT_PUBLIC_ADMIN_USER || "admin").trim(),
  password: (process.env.NEXT_PUBLIC_ADMIN_PASS || "atlas2025").trim(),
  role: "admin" as const,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem('atlas_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        sessionStorage.removeItem('atlas_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const validUser =
      VALID_CREDENTIAL.username.toLowerCase() === username.toLowerCase() &&
      VALID_CREDENTIAL.password === password;

    if (validUser) {
      const userData: User = { username: VALID_CREDENTIAL.username, role: VALID_CREDENTIAL.role };
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
