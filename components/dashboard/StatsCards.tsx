"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, CalendarDays } from "lucide-react";
import { useApi } from "@/lib/api";
import { useTranslation } from "@/lib/locale-context";
import { isToday, parseISO } from "date-fns";
import type { Session, AttendanceRecord } from "@/types/api";

interface StatsCardsProps {
  sessions: Session[];
}

function StatCard({
  color,
  icon: Icon,
  label,
  value,
  unit,
}: {
  color: string;
  icon: React.ElementType;
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <Card className={`border ${color.replace("bg-", "border-").replace("-500", "-100").replace("-600", "-100")} shadow-sm overflow-hidden`}>
      <div className={`h-1 w-full ${color}`} />
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`rounded-full ${color} p-2 text-white`}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="font-medium text-gray-600">{label}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <h2 className={`text-4xl font-bold ${color.replace("bg-", "text-")}`}>{value}</h2>
          <span className="text-gray-500 font-medium">{unit}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards({ sessions }: StatsCardsProps) {
  const { t } = useTranslation();

  const todaySessions = useMemo(
    () => sessions.filter((s) => isToday(parseISO(s.date))),
    [sessions]
  );

  const activeSession = todaySessions.find((s) => s.status === "active");

  const { data: attendanceRecords } = useApi<AttendanceRecord[]>(
    activeSession ? `/attendance/session/${activeSession._id}` : null
  );

  const present = (attendanceRecords ?? []).filter((r) => r.status === "present").length;
  const absent = (attendanceRecords ?? []).filter((r) => r.status === "absent").length;
  const late = (attendanceRecords ?? []).filter((r) => r.status === "late").length;
  const sessionsToday = todaySessions.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <StatCard color="bg-emerald-500" icon={CheckCircle2} label={t.dashboard.presentToday} value={present} unit={t.common.students} />
      <StatCard color="bg-red-500" icon={XCircle} label={t.dashboard.absentToday} value={absent} unit={t.common.students} />
      <StatCard color="bg-amber-500" icon={Clock} label={t.dashboard.lateToday} value={late} unit={t.common.students} />
      <StatCard color="bg-violet-600" icon={CalendarDays} label={t.dashboard.sessionsToday} value={sessionsToday} unit={t.common.sessions} />
    </div>
  );
}
