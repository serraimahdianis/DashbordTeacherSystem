"use client";

import { useMemo, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, CalendarDays } from "lucide-react";
import { axiosInstance } from "@/lib/api";
import { useTranslation } from "@/lib/locale-context";
import { isToday, parseISO } from "date-fns";
import type { Session, AttendanceRecord, Schedule } from "@/types/api";

interface StatsCardsProps {
  sessions: Session[];
  schedules: Schedule[];
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
    <Card className="overflow-hidden">
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

export function StatsCards({ sessions, schedules }: StatsCardsProps) {
  const { t } = useTranslation();

  const todaySessions = useMemo(
    () => (Array.isArray(sessions) ? sessions.filter((s) => isToday(parseISO(s.date))) : []),
    [sessions]
  );

  const todaySchedules = useMemo(() => {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = dayNames[new Date().getDay()];
    return Array.isArray(schedules) ? schedules.filter((s) => s.dayOfWeek === todayName) : [];
  }, [schedules]);

  // Aggregate attendance from ALL active + closed sessions today
  const todaySessionsWithData = useMemo(
    () => todaySessions.filter((s) => s.status === "active" || s.status === "closed"),
    [todaySessions]
  );

  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    if (todaySessionsWithData.length === 0) return;

    let cancelled = false;

    const fetchAll = async () => {
      try {
        const results = await Promise.all(
          todaySessionsWithData.map((s) =>
            axiosInstance.get<AttendanceRecord[]>(`/attendance/session/${s._id}`).then((r) => r.data)
          )
        );
        if (!cancelled) setAllRecords(results.flat());
      } catch {
        if (!cancelled) setAllRecords([]);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [todaySessionsWithData]);

  const present = allRecords.filter((r) => r.status === "present").length;
  const absent = allRecords.filter((r) => r.status === "absent").length;
  const late = allRecords.filter((r) => r.status === "late").length;
  
  // Sessions Today should count:
  // 1. All instantiated sessions for today (that aren't canceled)
  // 2. All schedules for today that haven't been instantiated yet
  const sessionsTodayCount = useMemo(() => {
    const instantiatedIds = new Set(todaySessions.map(s => s.scheduleId).filter(Boolean));
    const nonInstantiatedSchedules = todaySchedules.filter(sch => !instantiatedIds.has(sch._id));
    const validInstantiatedSessions = todaySessions.filter(s => s.status !== "canceled");
    return validInstantiatedSessions.length + nonInstantiatedSchedules.length;
  }, [todaySessions, todaySchedules]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 ">
      <StatCard color="bg-emerald-500" icon={CheckCircle2} label={t.dashboard.presentToday} value={present} unit={t.common.students} />
      <StatCard color="bg-red-500" icon={XCircle} label={t.dashboard.absentToday} value={absent} unit={t.common.students} />
      <StatCard color="bg-amber-500" icon={Clock} label={t.dashboard.lateToday} value={late} unit={t.common.students} />
      <StatCard color="bg-violet-600" icon={CalendarDays} label={t.dashboard.sessionsToday} value={sessionsTodayCount} unit={t.common.sessions} />
    </div>
  );
}
