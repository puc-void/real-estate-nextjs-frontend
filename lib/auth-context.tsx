"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "USER" | "AGENT" | "ADMIN";
  isVerified: boolean;
  isFraud: boolean;
  imageUrl: string;
  agentId?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (data: any) => Promise<{ success: boolean; message: string }>;
  register: (data: any) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile on startup
  useEffect(() => {
    async function loadUser() {
      try {
        const response = await axios.get("/api/v1/auth/me");
        if (response.data.success) {
          setUser(response.data.data);
        }
      } catch (err) {
        // Not logged in or expired
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (data: any) => {
    try {
      const response = await axios.post("/api/v1/auth/login", data);
      if (response.data.success) {
        setUser(response.data.data.user);
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message || "Login failed" };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || "Invalid credentials",
      };
    }
  };

  const register = async (data: any) => {
    try {
      const response = await axios.post("/api/v1/auth/register", data);
      return {
        success: true,
        message: response.data.message || "Registration successful",
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || "Registration failed",
      };
    }
  };

  const logout = async () => {
    // Clear cookies by setting the token cookie to expire
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setUser(null);
    window.location.href = "/auth/login";
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
