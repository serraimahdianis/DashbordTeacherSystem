// Domain types matching the NestJS backend API
// All dates from the API come as ISO strings — parse with new Date() at use site

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  department: string;
}

// Backend login returns ONLY { access_token, role }
// Teacher details are fetched separately via GET /teachers/:id
export interface LoginResponse {
  access_token: string;
  role: string;
}

export interface Teacher {
  _id: string;
  fullName: string;
  email: string;
  department: string;
  isVerified?: boolean;
}

export interface Student {
  _id: string;
  fullName: string;
  email: string;
  studentId: string;
  rfidCode: string;
  qrCode: string;
  group: string;
  year: string;
  speciality: string;
}

export interface Module {
  _id: string;
  name: string;
  teacherId: string;
  year: string;
}

export type ScheduleType = "cours" | "td" | "tp";
export type ScheduleYear = "L1" | "L2" | "L3" | "M1" | "M2";
export type DayOfWeek = "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";

export interface Schedule {
  _id: string;
  teacherId: string;
  moduleId: string | Module;
  type: ScheduleType;
  year: ScheduleYear;
  group: string | null;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string;
}

export type SessionStatus = "planned" | "active" | "closed";

export interface Session {
  _id: string;
  scheduleId: string | null;
  teacherId: string;
  moduleId: string | Module;
  date: string; // ISO datetime from MongoDB e.g. "2026-04-30T00:00:00.000Z"
  startTime: string;
  endTime: string;
  type: ScheduleType;
  group: string | null;
  status: SessionStatus;
  isReplacement: boolean;
  reasonForReplacement?: string;
}

export type AttendanceStatus = "present" | "late" | "absent";

export interface AttendanceRecord {
  _id: string;
  sessionId: string;
  studentId: string | Student; // Populated by backend with { fullName, studentId, group }
  status: AttendanceStatus;
  scanTime: string | null;
}

// Helper to extract module name from populated or unpopulated field
export function getModuleName(moduleId: string | Module | undefined): string {
  if (!moduleId) return "—";
  if (typeof moduleId === "string") return moduleId;
  return moduleId.name;
}

// Helper to extract student name from populated or unpopulated field
export function getStudentName(studentId: string | Student | undefined): string {
  if (!studentId) return "—";
  if (typeof studentId === "string") return studentId;
  return studentId.fullName;
}

// Helper to extract student rfid
export function getStudentRfid(studentId: string | Student | undefined): string {
  if (!studentId || typeof studentId === "string") return "—";
  return studentId.rfidCode;
}

// Decode JWT payload (no verification — just base64 decode the claims)
export function decodeJwtPayload(token: string): { sub: string; role: string } | null {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}
