"use client";

import { useMemo } from "react";
import { parseISO } from "date-fns";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from "next/link";
import { useApi } from "@/lib/api";
import { useTranslation } from "@/lib/locale-context";
import type { Session, AttendanceRecord } from "@/types/api";
import { getStudentName, getModuleName } from "@/types/api";

interface RecentActivityProps {
  sessions: Session[];
}

export function RecentActivity({ sessions }: RecentActivityProps) {
  const { t } = useTranslation();

  const recentSession = useMemo(
    () =>
      [...sessions]
        .filter((s) => s.status === "active" || s.status === "closed")
        .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null,
    [sessions]
  );

  const { data: records } = useApi<AttendanceRecord[]>(
    recentSession ? `/attendance/session/${recentSession._id}` : null
  );

  const recentScans = useMemo(() => {
    if (!records) return [];
    return [...records]
      .filter((r) => r.scanTime !== null)
      .sort((a, b) => {
        const ta = a.scanTime ? new Date(a.scanTime).getTime() : 0;
        const tb = b.scanTime ? new Date(b.scanTime).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 5);
  }, [records]);

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold text-gray-800">{t.dashboard.recentActivity}</CardTitle>
        <Link href="/sessions" className="text-sm text-violet-600 font-medium hover:underline">
          {t.common.viewAll}
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-5 mt-4">
          {recentScans.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-6">
              {recentSession ? t.live.noScans : t.common.noData}
            </p>
          )}
          {recentScans.map((record) => (
            <div key={record._id} className="flex gap-3">
              <div className="mt-0.5 relative z-10">
                {record.status === "present" && (
                  <div className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                )}
                {record.status === "late" && (
                  <div className="h-5 w-5 rounded-full bg-amber-500 text-white flex items-center justify-center">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                )}
                {record.status === "absent" && (
                  <div className="h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                    <XCircle className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
              <div className="flex-1 flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {getStudentName(record.studentId)}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-medium uppercase tracking-wider">
                    {recentSession ? getModuleName(recentSession.moduleId) : "—"} · {record.status}
                  </p>
                </div>
                <span className="text-xs font-medium text-gray-400 whitespace-nowrap ml-2">
                  {record.scanTime ? formatDate(record.scanTime, "HH:mm") : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
