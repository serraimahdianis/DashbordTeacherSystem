"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, BookOpen, Users, TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/locale-context";
import type { Session } from "@/types/api";
import { getModuleName } from "@/types/api";

export default function ReportsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: sessions, isLoading } = useApi<Session[]>(
    user?.id ? `/sessions/teacher/${user.id}` : null
  );
  const [exporting, setExporting] = useState(false);

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
      format(parseISO(s.date), "yyyy-MM-dd"),
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
                      {format(parseISO(session.date), "MMM d, yyyy")}
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
                      <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                        <FileText className="h-3 w-3" />
                        {t.sessions.view}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
