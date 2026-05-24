import axios from "axios";
import useSWR, { SWRConfiguration } from "swr";
import { getToken, logout } from "./utils";
import type {
  CreateModulePayload,
  CreateSchedulePayload,
  CreateSessionPayload,
  ScanPayload,
  SessionStatus,
} from "@/types/api";

// Backend runs at http://localhost:3000 with NO global prefix
// Endpoints: /auth/teacher/login, /students, /sessions/teacher/:id, etc.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ─── Axios Instance ────────────────────────────────────────────────────────────
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — inject JWT
axiosInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't logout on auth endpoints (login/register will naturally 401 on bad creds)
      const url = error.config?.url || "";
      const isAuthEndpoint = url.includes("/auth/");
      if (!isAuthEndpoint) {
        logout();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─── SWR fetcher using Axios ───────────────────────────────────────────────────
export const fetcher = (url: string) =>
  axiosInstance.get(url).then((r) => r.data);

// ─── SWR Hooks ────────────────────────────────────────────────────────────────
export function useApi<T>(url: string | null, options?: SWRConfiguration) {
  return useSWR<T>(url, fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
    ...options,
  });
}

export function usePolling<T>(url: string | null, interval = 3000) {
  return useSWR<T>(url, fetcher, {
    refreshInterval: interval,
    revalidateOnFocus: true,
  });
}

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    axiosInstance.post("/auth/teacher/login", { email, password }).then((r) => r.data),

  register: (data: { fullName: string; email: string; password: string; department: string }) =>
    axiosInstance.post("/auth/teacher/register", data).then((r) => r.data),

  verifyOtp: (email: string, otp: string) =>
    axiosInstance.post("/auth/teacher/verify-otp", { email, otp }).then((r) => r.data),
};

// ─── Teachers API ─────────────────────────────────────────────────────────────
export const teachersApi = {
  getById: (id: string) =>
    axiosInstance.get(`/teachers/${id}`).then((r) => r.data),
  update: (id: string, data: { fullName?: string; department?: string }) =>
    axiosInstance.patch(`/teachers/${id}`, data).then((r) => r.data),
};

// ─── Students API ─────────────────────────────────────────────────────────────
export const studentsApi = {
  getAll: (params?: { group?: string; year?: string }) =>
    axiosInstance.get("/students", { params }).then((r) => r.data),
  getById: (id: string) =>
    axiosInstance.get(`/students/${id}`).then((r) => r.data),
  getByRfid: (rfidCode: string) =>
    axiosInstance.get(`/students/rfid/${rfidCode}`).then((r) => r.data),
};

// ─── Modules API ──────────────────────────────────────────────────────────────
export const modulesApi = {
  getAll: () =>
    axiosInstance.get("/modules").then((r) => r.data),
  getByTeacher: (teacherId: string) =>
    axiosInstance.get(`/modules/teacher/${teacherId}`).then((r) => r.data),
  create: (data: CreateModulePayload) =>
    axiosInstance.post("/modules", data).then((r) => r.data),
  update: (id: string, data: Partial<CreateModulePayload>) =>
    axiosInstance.patch(`/modules/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    axiosInstance.delete(`/modules/${id}`).then((r) => r.data),
};

// ─── Schedules API ────────────────────────────────────────────────────────────
export const schedulesApi = {
  getByTeacher: (teacherId: string) =>
    axiosInstance.get(`/schedules/teacher/${teacherId}`).then((r) => r.data),
  create: (data: CreateSchedulePayload) =>
    axiosInstance.post("/schedules", data).then((r) => r.data),
  update: (id: string, data: Partial<CreateSchedulePayload>) =>
    axiosInstance.patch(`/schedules/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    axiosInstance.delete(`/schedules/${id}`).then((r) => r.data),
};

// ─── Sessions API ─────────────────────────────────────────────────────────────
export const sessionsApi = {
  getByTeacher: (teacherId: string) =>
    axiosInstance.get(`/sessions/teacher/${teacherId}`).then((r) => r.data),
  getById: (id: string) =>
    axiosInstance.get(`/sessions/${id}`).then((r) => r.data),
  startFromSchedule: (scheduleId: string) =>
    axiosInstance.post(`/sessions/start/${scheduleId}`).then((r) => r.data),
  end: (sessionId: string) =>
    axiosInstance.post(`/sessions/${sessionId}/end`).then((r) => r.data),
  createReplacement: (data: CreateSessionPayload) =>
    axiosInstance.post("/sessions", data).then((r) => r.data),
  getNonce: (id: string) =>
    axiosInstance.get(`/sessions/${id}/nonce`).then((r) => r.data),
  updateStatus: (id: string, status: SessionStatus) =>
    axiosInstance.patch(`/sessions/${id}/status`, { status }).then((r) => r.data),
  delete: (id: string) =>
    axiosInstance.delete(`/sessions/${id}`).then((r) => r.data),
};

// ─── Attendance API ───────────────────────────────────────────────────────────
export const attendanceApi = {
  scan: (data: ScanPayload) =>
    axiosInstance.post("/attendance/scan", data).then((r) => r.data),
  getBySession: (sessionId: string) =>
    axiosInstance.get(`/attendance/session/${sessionId}`).then((r) => r.data),
  getByStudent: (studentId: string) =>
    axiosInstance.get(`/attendance/student/${studentId}`).then((r) => r.data),
};