"use client";

import { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import {
  ArrowLeft,
  Square,
  UserCheck,
  Clock,
  UserX,
  Users,
  Search,
  CreditCard,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { parseISO, format } from "date-fns";
import { fetcher, usePolling, studentsApi, attendanceApi, sessionsApi } from "@/lib/api";
import {
  getSocket,
  connectSocket,
  joinSessionRoom,
  leaveSessionRoom,
  on,
  off,
} from "@/lib/socket";
import { useTranslation } from "@/lib/locale-context";
import type { Session, AttendanceRecord, AttendanceStatus, Student } from "@/types/api";
import { getModuleName, getStudentName, getStudentId } from "@/types/api";

type StatusFilter = "all" | "present" | "late" | "absent";

export default function LiveSessionPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;
  const router = useRouter();
  const { t } = useTranslation();

  const { data: session, mutate: mutateSession } = usePolling<Session>(
    `/sessions/${sessionId}`,
    5000
  );

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [socketOnline, setSocketOnline] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [rfidInput, setRfidInput] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanMsg, setScanMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [endingSession, setEndingSession] = useState(false);

  const [changingStatusId, setChangingStatusId] = useState<string | null>(null);
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Time update for elapsed timer
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);



  // Calculate elapsed time from session start
  const elapsedTime = useMemo(() => {
    if (!session) return 0;
    // If the session is actively running, calculate elapsed time relative to today's date
    const sessionDate = session.status === "active" ? new Date() : parseISO(session.date);
    const [hours, minutes] = session.startTime.split(":").map(Number);
    sessionDate.setHours(hours, minutes, 0, 0);
    const diff = Math.floor((now - sessionDate.getTime()) / 1000);
    return diff > 0 ? diff : 0;
  }, [now, session]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // WebSocket: connect to session room on mount
  useEffect(() => {
    connectSocket();

    const onScan = (payload: {
    sessionId: string;
    studentId: string;
    studentName: string;
    status: string;
    scanTime: string;
  }) => {
      setRecords((prev) => {
        const existingIdx = prev.findIndex(
          (r) => getStudentId(r.studentId) === payload.studentId
        );
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            status: payload.status as AttendanceStatus,
            scanTime: payload.scanTime,
          };
          return updated;
        }
        return [
          ...prev,
          {
            _id: `ws-${payload.studentId}-${Date.now()}`,
            sessionId,
            studentId: { _id: payload.studentId, fullName: payload.studentName } as unknown as Student,
            status: payload.status as AttendanceStatus,
            scanTime: payload.scanTime,
          },
        ];
      });
    };

    const onStatusChanged = (payload: {
      sessionId: string;
      studentId: string;
      newStatus: string;
    }) => {
      setRecords((prev) =>
        prev.map((r) =>
          getStudentId(r.studentId) === payload.studentId
            ? { ...r, status: payload.newStatus as AttendanceStatus }
            : r
        )
      );
    };

    const onSessionEnded = () => {
      mutateSession();
    };

    on("attendance:scan", onScan);
    on("attendance:status-changed", onStatusChanged);
    on("session:ended", onSessionEnded);

    // Track socket status: check periodically instead of relying on
    // addEventListener on a single socket ref (which breaks on reconnects).
    const statusInterval = setInterval(() => {
      const sock = getSocket();
      const isOpen = sock !== null && sock.readyState === WebSocket.OPEN;
      setSocketOnline(isOpen);
    }, 2000);

    // The statusInterval will pick up the initial online status on its first tick.
    // To avoid synchronous setState in useEffect, we just let the interval handle it,
    // or trigger it asynchronously if we really need it immediately.

    // Fetch initial attendance data with high limit to retrieve all students
    fetcher(`/attendance/session/${sessionId}?limit=1000`)
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setRecords(list);
      })
      .catch(() => {});

    joinSessionRoom(sessionId);

    return () => {
      off("attendance:scan", onScan);
      off("attendance:status-changed", onStatusChanged);
      off("session:ended", onSessionEnded);
      clearInterval(statusInterval);
      leaveSessionRoom(sessionId);
    };
  }, [sessionId, mutateSession]);

  // Fallback polling when socket is offline
  useEffect(() => {
    if (socketOnline) return;
    const interval = setInterval(async () => {
      try {
        const data = await fetcher(`/attendance/session/${sessionId}?limit=1000`);
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setRecords(list);
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [sessionId, socketOnline]);

  const filteredAttendance = useMemo(
    () =>
      records.filter((r) => {
        const name = getStudentName(r.studentId).toLowerCase();
        const matchesSearch = name.includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || r.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [records, searchQuery, statusFilter]
  );

  const presentCount = records.filter((r) => r.status === "present").length;
  const lateCount = records.filter((r) => r.status === "late").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const totalCount = records.length;

  const pieData = [
    { name: t.live.present, value: presentCount, color: "#10b981" },
    { name: t.live.late, value: lateCount, color: "#f59e0b" },
    { name: t.live.absent, value: absentCount, color: "#ef4444" },
  ];

  const recentScans = useMemo(
    () =>
      [...records]
        .filter((r) => r.scanTime !== null && r.scanTime !== undefined)
        .sort((a, b) => {
          const ta = a.scanTime ? new Date(a.scanTime).getTime() : 0;
          const tb = b.scanTime ? new Date(b.scanTime).getTime() : 0;
          return tb - ta;
        })
        .slice(0, 5),
    [records]
  );

  // Calculate if student should be marked as late (after 15 minutes from start)
  const getScanStatus = useCallback((): AttendanceStatus => {
    if (!session) return "present";

    const now = new Date();
    const [startH, startM] = session.startTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const gracePeriodMinutes = 15;

    return nowMinutes > startMinutes + gracePeriodMinutes ? "late" : "present";
  }, [session]);

  // Handle RFID scan
  const handleRfidScan = useCallback(async () => {
    if (!rfidInput.trim() || !sessionId) return;

    setScanLoading(true);
    setScanMsg(null);

    try {
      const student = await studentsApi.getByRfid(rfidInput.trim());
      const status = getScanStatus();

      await attendanceApi.scan({
        sessionId,
        studentId: student._id,
        status,
        scanTime: new Date().toISOString(),
      });

      const statusText = status === "late" ? t.live.late : t.live.present;
      setScanMsg({ text: `✓ ${student.fullName} — ${statusText}`, ok: true });
      setRfidInput("");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setScanMsg({ text: msg || t.common.error, ok: false });
    } finally {
      setScanLoading(false);
    }
  }, [rfidInput, sessionId, getScanStatus, t]);

  // Handle manual status change
  const handleStatusChange = useCallback(
    async (record: AttendanceRecord, newStatus: AttendanceStatus) => {
      if (newStatus === record.status) return;

      setChangingStatusId(record._id);
      try {
        const studentId = getStudentId(record.studentId);

        await attendanceApi.scan({
          sessionId,
          studentId,
          status: newStatus,
          scanTime: newStatus === "absent" ? undefined : new Date().toISOString(),
          method: "MANUAL",
        });
      } catch (err) {
        console.error("Failed to update status:", err);
      } finally {
        setChangingStatusId(null);
      }
    },
    [sessionId]
  );

  // Cycle through statuses: present -> late -> absent -> present
  const cycleStatus = useCallback(
    async (record: AttendanceRecord) => {
      const statusCycle: Record<string, AttendanceStatus> = {
        present: "late",
        late: "absent",
        absent: "present",
      };
      const newStatus = statusCycle[record.status] || "present";
      await handleStatusChange(record, newStatus);
    },
    [handleStatusChange]
  );

  // End session and navigate back
  const handleEndSession = async () => {
    if (!sessionId) return;
    setEndingSession(true);
    try {
      await sessionsApi.end(sessionId);
      await mutateSession();
      router.push("/sessions");
    } catch (err) {
      console.error("Failed to end session:", err);
      setEndingSession(false);
    }
  };

  const pct = (n: number) => (totalCount > 0 ? ((n / totalCount) * 100).toFixed(1) : "0");

  const getStatusIcon = (status: string) => {
    if (status === "present") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (status === "late") return <Clock className="h-4 w-4 text-amber-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  // Get badge variant based on status
  const getBadgeVariant = (status: string): "present" | "late" | "absent" => {
    if (status === "present") return "present";
    if (status === "late") return "late";
    return "absent";
  };

  // Show session ended message if closed
  const isSessionEnded = session?.status === "closed";

  return (
    <div className="flex flex-col space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/sessions" className="text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t.live.title}</h1>
            {session?.status === "active" && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm ml-2 px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse inline-block" />
                {t.live.running}
              </Badge>
            )}
            {isSessionEnded && (
              <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 shadow-sm ml-2 px-2 py-0.5">
                {t.sessions.closed}
              </Badge>
            )}
          </div>
          <p className="text-gray-500 mt-1 ml-8 text-sm">
            {isSessionEnded ? t.sessions.closed + " — " + t.live.subtitle : t.live.subtitle}
          </p>
        </div>
        {session?.status === "active" && (
          <Button
            variant="outline"
            className="text-red-500 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-600 font-bold h-10 px-4 gap-2"
            onClick={handleEndSession}
            disabled={endingSession}
          >
            {endingSession ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4 fill-current" />}
            {endingSession ? t.common.loading : t.live.endSession}
          </Button>
        )}
      </div>

      {/* Session info + stats */}
      <div className="flex flex-col xl:flex-row gap-6">
        <Card className="flex-1">
          <CardContent className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 h-full">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                <CreditCard className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {session ? getModuleName(session.moduleId) : t.common.loading}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  {session && (
                    <>
                      <span>{t.sessions.type}: <span className="font-semibold text-gray-700">{session.type.toUpperCase()}</span></span>
                      <span>•</span>
                      <span>{t.sessions.group}: <span className="font-semibold text-gray-700">{session.group ?? "—"}</span></span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:items-end">
              {session && (
                <>
                  <div className="text-sm text-gray-500 font-medium">
                    {format(parseISO(session.date), "EEEE, d MMMM yyyy")}
                  </div>
                  <div className="text-xl font-bold text-gray-900 mt-1">
                    {session.startTime} - {session.endTime}
                  </div>
                </>
              )}
              <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {t.live.elapsed}: <span className="font-bold ml-1">{formatTime(elapsedTime)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 xl:w-auto">
          {[
            { icon: UserCheck, color: "text-emerald-500", label: t.live.present, val: presentCount },
            { icon: Clock, color: "text-amber-500", label: t.live.late, val: lateCount },
            { icon: UserX, color: "text-red-500", label: t.live.absent, val: absentCount },
            { icon: Users, color: "text-violet-600", label: t.live.total, val: totalCount },
          ].map(({ icon: Icon, color, label, val }) => (
            <Card key={label} className="flex flex-col justify-center px-6 py-4 xl:min-w-[130px]">
              <div className="flex justify-between items-start">
                <Icon className={`h-6 w-6 ${color}`} />
                <span className="text-3xl font-bold text-gray-900 leading-none">{val}</span>
              </div>
              <div className="text-sm text-gray-500 font-medium mt-3">{label}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* Table + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance table */}
        <Card className="lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-4 bg-gray-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-bold text-gray-900">{t.live.students}</h3>
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t.live.searchStudent}
                  className="pl-9 h-9 border-gray-200 bg-gray-50 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="h-9 rounded-full border-0 bg-gray-50/50 px-3 text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-violet-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              >
                <option value="all">{t.live.allStatus}</option>
                <option value="present">{t.live.present}</option>
                <option value="late">{t.live.late}</option>
                <option value="absent">{t.live.absent}</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                  <TableHead className="font-bold text-gray-900 w-10">#</TableHead>
                  <TableHead className="font-bold text-gray-900">{t.nav.students}</TableHead>
                  <TableHead className="font-bold text-gray-900 text-center">{t.sessions.status}</TableHead>
                  <TableHead className="font-bold text-gray-900 text-center">{t.live.scanTime}</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendance.map((record, index) => (
                  <TableRow key={record._id} className="border-b border-gray-100">
                    <TableCell className="text-gray-500 font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-violet-100 text-violet-700 font-bold text-xs">
                            {getStudentName(record.studentId).substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-gray-900">{getStudentName(record.studentId)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Badge variant={getBadgeVariant(record.status)}>
                          {record.status === "present" ? t.live.present : record.status === "late" ? t.live.late : t.live.absent}
                        </Badge>
                        {!isSessionEnded && (
                          <button
                            onClick={() => cycleStatus(record)}
                            disabled={changingStatusId === record._id}
                            className="text-xs text-violet-600 hover:text-violet-800 font-medium disabled:opacity-50"
                            title={t.common.edit}
                          >
                            {changingStatusId === record._id ? <Loader2 className="h-3 w-3 animate-spin" /> : "↻"}
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 text-center font-mono text-sm">
                      {record.scanTime ? format(parseISO(record.scanTime), "HH:mm:ss") : "—"}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      {getStatusIcon(record.status)}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAttendance.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      {records.length === 0 ? t.live.noScans : t.common.noData}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-between items-center p-4 text-sm text-gray-500 bg-gray-50/10">
            <div>{filteredAttendance.length} / {totalCount} {t.common.students}</div>
          </div>
        </Card>

        {/* Right sidebar */}
        <div className="space-y-6">


          {/* RFID Scanner */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-0 pt-5">
              <CardTitle className="text-base font-bold text-gray-900">{t.live.rfidOnly}</CardTitle>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t.live.listening}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-6">
              <div className="relative flex items-center justify-center h-24 w-24 mb-6">
                <div className="absolute inset-0 rounded-full bg-emerald-50 animate-ping opacity-75" />
                <div className="absolute inset-2 rounded-full bg-emerald-100 animate-ping opacity-50" style={{ animationDelay: "0.5s" }} />
                <div className="relative z-10 h-14 w-14 bg-white rounded-full flex items-center justify-center shadow-sm border border-emerald-100">
                  <CreditCard className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">{t.live.scanCard}</p>
              <p className="text-xs text-gray-500 mb-4">
                {session ? `Grace period: 15 min after ${session.startTime}` : t.live.rfidInput}
              </p>
              <div className="flex gap-2 w-full">
                <Input
                  placeholder={t.live.rfidInput}
                  value={rfidInput}
                  onChange={(e) => setRfidInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRfidScan()}
                  className="flex-1 h-9 text-sm"
                  disabled={isSessionEnded}
                />
                <Button
                  onClick={handleRfidScan}
                  disabled={!rfidInput.trim() || scanLoading || isSessionEnded}
                  className="bg-violet-600 hover:bg-violet-700 text-white h-9 px-3 text-xs font-semibold"
                >
                  {scanLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.live.recordScan}
                </Button>
              </div>
              {scanMsg && (
                <p className={`text-xs mt-2 font-medium ${scanMsg.ok ? "text-emerald-600" : "text-red-500"}`}>
                  {scanMsg.text}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Scans */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
              <CardTitle className="text-sm font-bold text-gray-900">{t.live.recentScans}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-3">
                {recentScans.map((record) => (
                  <div key={record._id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                        record.status === "present" ? "bg-emerald-500" : record.status === "late" ? "bg-amber-500" : "bg-red-500"
                      }`} />
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarFallback className="text-[10px] bg-violet-100 text-violet-700">
                          {getStudentName(record.studentId).substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-gray-900 truncate">{getStudentName(record.studentId)}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-gray-500 font-mono text-xs whitespace-nowrap">
                        {record.scanTime ? format(parseISO(record.scanTime), "HH:mm:ss") : "—"}
                      </span>
                      <span className={`text-xs font-semibold capitalize ${record.status === "present" ? "text-emerald-500" : record.status === "late" ? "text-amber-500" : "text-red-500"}`}>
                        {record.status === "present" ? t.live.present : record.status === "late" ? t.live.late : t.live.absent}
                      </span>
                    </div>
                  </div>
                ))}
                {recentScans.length === 0 && (
                  <p className="text-gray-400 text-xs text-center py-2">{t.live.noScans}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pie chart summary */}
          <Card>
            <CardHeader className="pb-0 pt-4">
              <CardTitle className="text-sm font-bold text-gray-900">{t.live.attendanceSummary}</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 pb-4">
              <div className="flex items-center">
                <div className="h-[120px] w-[120px] min-h-[120px] relative">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height={120} debounce={50}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={55}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-lg font-bold text-gray-900 leading-none">{totalCount}</span>
                    <span className="text-[10px] font-medium text-gray-500">{t.live.total}</span>
                  </div>
                </div>
                <div className="flex-1 pl-4 space-y-3">
                  {[
                    { color: "bg-emerald-500", label: t.live.present, count: presentCount, p: pct(presentCount) },
                    { color: "bg-amber-500", label: t.live.late, count: lateCount, p: pct(lateCount) },
                    { color: "bg-red-500", label: t.live.absent, count: absentCount, p: pct(absentCount) },
                  ].map(({ color, label, count, p }) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${color}`} />
                        <span className="font-medium text-gray-700">{label}</span>
                      </div>
                      <span className="font-medium text-gray-500">{count} ({p}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}