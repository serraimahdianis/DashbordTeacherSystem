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
  updateUser: (updatedFields: Partial<AuthUser>) => void;
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
    // Try teacher login first, if it fails try admin login
    let data: { access_token: string; role: string };
    let isAdmin = false;

    try {
      data = await authApi.login(email, password);
    } catch {
      // Teacher login failed — try admin login
      data = await authApi.adminLogin(email, password);
      isAdmin = true;
    }

    const token = data.access_token;
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.sub) {
      throw new Error("Invalid token received from server");
    }

    // Check if the role from the JWT is admin
    if (payload.role === "admin") {
      isAdmin = true;
    }

    if (isAdmin) {
      // Admin — no profile in DB, build a synthetic user
      const authUser: AuthUser = {
        id: "admin",
        email: email,
        fullName: "Administrator",
        department: "System Admin",
        role: "admin",
      };
      setCurrentUser(authUser, token);
      setUser(authUser);
      router.push("/admin");
      return;
    }

    // Teacher — fetch full profile
    setCurrentUser({ id: payload.sub, email: "", fullName: "", department: "", role: "teacher" }, token);

    const teacherData = await teachersApi.getById(payload.sub);
    if (!teacherData || typeof teacherData._id !== 'string') {
      throw new Error('Invalid teacher profile received from server');
    }
    const teacher = teacherData as Teacher;

    const teacherId = teacher._id ?? (teacher as unknown as { id?: string }).id;
    const authUser: AuthUser = {
      id: teacherId ?? "",
      email: teacher.email,
      fullName: teacher.fullName,
      department: teacher.department,
      role: "teacher",
      groups: teacher.groups || [],
      years: teacher.years || [],
      specialities: teacher.specialities || [],
    };
    setCurrentUser(authUser, token);
    setUser(authUser);
    router.push("/dashboard");
  }, [router]);

  const register = useCallback(async (data: { fullName: string; email: string; password: string; department: string }) => {
    await authApi.register(data);
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    await authApi.verifyOtp(email, otp);
    router.push("/login");
  }, [router]);

  const logout = useCallback(() => {
    logoutUtils();
    setUser(null);
    router.push("/login");
  }, [router]);

  const updateUser = useCallback((updatedFields: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_user", JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, verifyOtp, logout, updateUser }}>
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