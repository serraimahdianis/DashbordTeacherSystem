"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, BookOpen, Users, TrendingUp, Printer } from "lucide-react";
import { parseISO } from "date-fns";
import { formatDate } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/locale-context";
import type { Session, AttendanceRecord } from "@/types/api";
import { getModuleName, getStudentName } from "@/types/api";

function ReportAttendanceTable({ sessionId }: { sessionId: string }) {
  const { t } = useTranslation();
  const { data: records, isLoading } = useApi<AttendanceRecord[]>(`/attendance/session/${sessionId}`);

  const attendance = records ?? [];
  const presentCount = attendance.filter((r) => r.status === "present").length;
  const lateCount = attendance.filter((r) => r.status === "late").length;
  const absentCount = attendance.filter((r) => r.status === "absent").length;
  const total = attendance.length;

  if (isLoading) {
    return (
      <div className="py-12 text-center text-gray-400 flex items-center justify-center gap-2 text-sm">
        <div className="h-4 w-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        {t.common?.loading || "Loading attendance roster..."}
      </div>
    );
  }

  return (
    <div>
      {/* Metrics Summary Row */}
      <div className="grid grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-xl print:bg-transparent print:border print:border-gray-200">
        <div className="text-center border-r border-gray-200 last:border-none">
          <div className="text-xs text-gray-500 font-medium">Total Roster</div>
          <div className="text-lg font-bold text-gray-900 mt-0.5">{total}</div>
        </div>
        <div className="text-center border-r border-gray-200 last:border-none">
          <div className="text-xs text-emerald-600 font-medium">{t.live?.present || "Present"}</div>
          <div className="text-lg font-bold text-emerald-700 mt-0.5">{presentCount}</div>
        </div>
        <div className="text-center border-r border-gray-200 last:border-none">
          <div className="text-xs text-amber-600 font-medium">{t.live?.late || "Late"}</div>
          <div className="text-lg font-bold text-amber-700 mt-0.5">{lateCount}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-red-600 font-medium">{t.live?.absent || "Absent"}</div>
          <div className="text-lg font-bold text-red-700 mt-0.5">{absentCount}</div>
        </div>
      </div>

      {/* Roster Table */}
      <Table className="print:text-xs">
        <TableHeader>
          <TableRow className="bg-gray-100/80 hover:bg-gray-100/80 print:bg-gray-100">
            <TableHead className="font-bold text-gray-900 w-12">#</TableHead>
            <TableHead className="font-bold text-gray-900">{t.nav?.students || "Student Name"}</TableHead>
            <TableHead className="font-bold text-gray-900 text-center w-24">{t.sessions?.status || "Status"}</TableHead>
            <TableHead className="font-bold text-gray-900 text-right w-32">{t.live?.scanTime || "Scan Time"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendance.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-gray-400 italic">
                No attendance scans recorded for this session.
              </TableCell>
            </TableRow>
          )}
          {attendance.map((r, i) => (
            <TableRow key={r._id} className="border-b border-gray-100 print:border-gray-200">
              <TableCell className="text-gray-500 font-mono">{i + 1}</TableCell>
              <TableCell className="font-semibold text-gray-900">
                {getStudentName(r.studentId)}
              </TableCell>
              <TableCell className="text-center">
                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                  r.status === "present" ? "bg-emerald-50 text-emerald-700 print:border print:border-emerald-300" :
                  r.status === "late" ? "bg-amber-50 text-amber-700 print:border print:border-amber-300" :
                  "bg-red-50 text-red-700 print:border print:border-red-300"
                }`}>
                  {r.status === "present" ? (t.live?.present || "Present") : r.status === "late" ? (t.live?.late || "Late") : (t.live?.absent || "Absent")}
                </span>
              </TableCell>
              <TableCell className="text-right font-mono text-gray-500 text-xs">
                {r.scanTime ? format(parseISO(r.scanTime), "HH:mm:ss") : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-8 pt-4 border-t border-gray-200 text-center text-[10px] text-gray-400 print:block hidden">
        Smart Attendance System • Certified Teacher Copy • Printed on {format(new Date(), "PPpp")}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: sessions, isLoading } = useApi<Session[]>(
    user?.id ? `/sessions/teacher/${user.id}` : null
  );
  const [exporting, setExporting] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const allSessions = useMemo(() => sessions ?? [], [sessions]);
  const completedSessions = useMemo(
    () =>
      allSessions
        .filter((s) => s.status === "closed")
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allSessions]
  );

  const uniqueModules = new Set(completedSessions.map((s) => getModuleName(s.moduleId))).size;

  const handleExportCSV = () => {
    setExporting(true);
    const headers = ["Session ID", t.sessions.date, t.sessions.module, t.sessions.type, t.sessions.group, t.sessions.time, t.sessions.status];
    const rows = completedSessions.map((s) => [
      s._id,
      formatDate(s.date, "yyyy-MM-dd"),
      getModuleName(s.moduleId),
      s.type.toUpperCase(),
      s.group ?? "—",
      `${s.startTime}-${s.endTime}`,
      s.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  const getTypeBadge = (type: string) => {
    const upper = type.toUpperCase();
    const cls =
      upper === "TP"
        ? "bg-blue-50 text-blue-600 border-transparent font-bold"
        : upper === "TD"
        ? "bg-emerald-50 text-emerald-600 border-transparent font-bold"
        : "bg-violet-50 text-violet-600 border-transparent font-bold";
    return <Badge variant="outline" className={cls}>{upper}</Badge>;
  };

  return (
    <div className="flex flex-col space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t.nav.reports}</h1>
          <p className="text-gray-500 mt-1">{t.sessions.exportReport}</p>
        </div>
        <Button
          className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
          onClick={handleExportCSV}
          disabled={exporting || completedSessions.length === 0}
        >
          <Download className="h-4 w-4" />
          {exporting ? t.common.loading : "Export CSV"}
        </Button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              {t.sessions.completed}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{completedSessions.length}</div>
            <p className="text-xs text-emerald-600 mt-1">{t.common.sessions}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-violet-500" />
              {t.sessions.module}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{uniqueModules}</div>
            <p className="text-xs text-gray-500 mt-1">{t.sessions.allModules}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-500" />
              {t.common.sessions}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{allSessions.length}</div>
            <p className="text-xs text-gray-500 mt-1">{t.sessions.planned} + {t.sessions.inProgress}</p>
          </CardContent>
        </Card>
      </div>

      {/* Historical sessions table */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t.sessions.completed}</CardTitle>
          <Badge variant="secondary" className="font-medium">{completedSessions.length} {t.common.sessions}</Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                  <TableHead className="font-bold text-gray-900">ID</TableHead>
                  <TableHead className="font-bold text-gray-900">{t.sessions.date}</TableHead>
                  <TableHead className="font-bold text-gray-900">{t.sessions.module}</TableHead>
                  <TableHead className="font-bold text-gray-900">{t.sessions.type}</TableHead>
                  <TableHead className="font-bold text-gray-900 text-center">{t.sessions.group}</TableHead>
                  <TableHead className="font-bold text-gray-900 text-center">{t.sessions.time}</TableHead>
                  <TableHead className="font-bold text-gray-900 text-right">{t.sessions.action}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2 text-gray-400">
                        <div className="h-4 w-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                        {t.common.loading}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && completedSessions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      {t.sessions.noCompleted}
                    </TableCell>
                  </TableRow>
                )}
                {completedSessions.map((session) => (
                  <TableRow key={session._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <TableCell className="font-mono text-xs text-gray-500 max-w-[120px] truncate">
                      {session._id}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {formatDate(session.date, "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900">
                      {getModuleName(session.moduleId)}
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(session.type)}
                    </TableCell>
                    <TableCell className="text-center text-gray-600">
                      {session.group ? `${t.sessions.group} ${session.group}` : "—"}
                    </TableCell>
                    <TableCell className="text-center text-gray-600 font-mono text-sm">
                      {session.startTime}–{session.endTime}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-1.5 text-xs border-violet-200 text-violet-700 hover:bg-violet-50"
                        onClick={() => setSelectedSession(session)}
                      >
                        <FileText className="h-3 w-3" />
                        Export PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Print/PDF Export Overlay Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0">
          <style jsx global>{`
            @media print {
              @page {
                size: auto;
                margin: 10mm;
              }
              html, body {
                height: auto !important;
                overflow: visible !important;
                background: none !important;
              }
              body * {
                visibility: hidden;
              }
              .printable-section, .printable-section * {
                visibility: visible;
              }
              .printable-section {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 0 !important;
                margin: 0 !important;
                box-shadow: none !important;
                page-break-after: avoid;
                break-after: avoid;
              }
              tr {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              thead {
                display: table-header-group;
              }
            }
          `}</style>
          <div className="printable-section bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto print:max-h-none print:shadow-none print:rounded-none">
            {/* Modal Header (Hidden during print) */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 print:hidden">
              <div>
                <h3 className="font-bold text-gray-900 text-base">{t.sessions?.view || "Report Preview"} — {getModuleName(selectedSession.moduleId)}</h3>
                <p className="text-xs text-gray-500">{formatDate(selectedSession.date, "PPP")}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => window.print()} 
                  className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5 h-8 text-xs font-medium"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / Save PDF
                </Button>
                <Button 
                  variant="ghost" 
                  className="h-8 w-8 rounded-full p-0 font-bold text-gray-500 hover:bg-gray-200" 
                  onClick={() => setSelectedSession(null)}
                >
                  ✕
                </Button>
              </div>
            </div>

            {/* Printable Content Area */}
            <div className="p-8 overflow-y-auto print:p-0 print:overflow-visible flex-1">
              {/* Header for PDF document */}
              <div className="border-b-2 border-gray-900 pb-6 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">ATTENDANCE REPORT</h1>
                    <p className="text-sm font-bold text-violet-600 mt-1">{getModuleName(selectedSession.moduleId)}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold bg-gray-100 text-gray-800 px-2 py-1 rounded inline-block uppercase tracking-wider mb-1">
                      {selectedSession.type} {selectedSession.group ? `• Group ${selectedSession.group}` : ""}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(selectedSession.date, "EEEE, MMMM d, yyyy")}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{selectedSession.startTime} – {selectedSession.endTime}</p>
                  </div>
                </div>
              </div>

              {/* Attendance Table */}
              <ReportAttendanceTable sessionId={selectedSession._id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
