"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { AuthUser, Teacher } from "@/types/api";
import { decodeJwtPayload } from "@/types/api";
import { authApi, teachersApi } from "@/lib/api";
import { getCurrentUser, setCurrentUser, logout as logoutUtils } from "@/lib/utils";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { fullName: string; email: string; password: string; department: string }) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore user from localStorage on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      let storedUser = getCurrentUser() as AuthUser | null;
      
      // Fix for previously cached users with undefined id
      if (storedUser && !storedUser.id) {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        if (token) {
          const payload = decodeJwtPayload(token);
          if (payload?.sub) {
            storedUser = { ...storedUser, id: payload.sub };
            setCurrentUser(storedUser, token);
          }
        }
      }
      
      setUser(storedUser);
      setIsLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Step 1: Call login endpoint → returns { access_token, role }
    const data = await authApi.login(email, password);
    const token = data.access_token;

    // Step 2: Decode JWT to get teacher ID (payload.sub)
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.sub) {
      throw new Error("Invalid token received from server");
    }

    // Step 3: Store token first so the next request can use it
    // (temporarily store minimal user so getToken() works)
    setCurrentUser({ id: payload.sub, email: "", fullName: "", department: "" }, token);

    // Step 4: Fetch full teacher profile from GET /teachers/:id
    const teacher: Teacher = await teachersApi.getById(payload.sub);

    // Step 5: Build the AuthUser and persist
    const teacherUnknown = teacher as unknown as { id?: string };
    const teacherId = (teacher as Teacher)._id ?? teacherUnknown.id;
    const authUser: AuthUser = {
      id: teacherId ?? "",
      email: teacher.email,
      fullName: teacher.fullName,
      department: teacher.department,
    };
    setCurrentUser(authUser, token);
    setUser(authUser);
    router.push("/dashboard");
  }, [router]);

  const register = useCallback(async (data: { fullName: string; email: string; password: string; department: string }) => {
    await authApi.register(data);
    // Backend sends OTP to email — caller handles UI step transition
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    await authApi.verifyOtp(email, otp);
    // After verification, redirect to login
    router.push("/login");
  }, [router]);

  const logout = useCallback(() => {
    logoutUtils();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}