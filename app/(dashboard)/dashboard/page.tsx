"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isToday, parseISO } from "date-fns";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { CalendarDays } from "lucide-react";
import { useApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/locale-context";
import type { Session } from "@/types/api";
import { getModuleName } from "@/types/api";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";
import { sessionsApi } from "@/lib/api";
import type { Schedule } from "@/types/api";

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  
  const { data: sessions, isLoading, mutate } = useApi<Session[]>(
    user?.id ? `/sessions/teacher/${user.id}` : null
  );
  
  const { data: schedules } = useApi<Schedule[]>(
    user?.id ? `/schedules/teacher/${user.id}` : null
  );

  const [startingId, setStartingId] = useState<string | null>(null);

  const todaySessions = useMemo(() => {
    if (!sessions) return [];
    return sessions
      .filter((s) => isToday(parseISO(s.date)))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [sessions]);

  // Find all schedules for today's day of week
  const todaySchedules = useMemo(() => {
    if (!schedules) return [];
    const todayName = format(new Date(), "EEEE"); // "Sunday", "Monday", etc.
    return schedules
      .filter((s) => s.dayOfWeek === todayName)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [schedules]);

  // Combine today's schedules and any replacement sessions scheduled for today
  const displayedItems = useMemo(() => {
    const items: Array<{
      id: string;
      scheduleId: string | null;
      startTime: string;
      endTime: string;
      moduleId: string | import("@/types/api").Module;
      group: string | null;
      type: string;
      status: "pending" | "active" | "closed";
      sessionId?: string;
    }> = [];

    // Map schedules
    todaySchedules.forEach((sch) => {
      // Check if a session already exists for this schedule today
      const session = todaySessions.find((s) => s.scheduleId === sch._id);
      items.push({
        id: sch._id,
        scheduleId: sch._id,
        startTime: sch.startTime,
        endTime: sch.endTime,
        moduleId: sch.moduleId,
        group: sch.group,
        type: sch.type,
        status: session ? (session.status as "active" | "closed") : "pending",
        sessionId: session?._id,
      });
    });

    // Add replacement sessions that don't belong to today's standard schedule
    todaySessions.forEach((sess) => {
      if (!sess.scheduleId || !todaySchedules.find((s) => s._id === sess.scheduleId)) {
        items.push({
          id: sess._id,
          scheduleId: sess.scheduleId,
          startTime: sess.startTime,
          endTime: sess.endTime,
          moduleId: sess.moduleId,
          group: sess.group,
          type: sess.type,
          status: sess.status as "pending" | "active" | "closed", // replacement sessions start as planned ("pending")
          sessionId: sess._id,
        });
      }
    });

    return items.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [todaySchedules, todaySessions]);

  const handleStartSession = async (item: typeof displayedItems[0]) => {
    setStartingId(item.id);
    try {
      let newSessionId = item.sessionId;
      if (item.scheduleId && !item.sessionId) {
        // Start from schedule
        const newSession = await sessionsApi.startFromSchedule(item.scheduleId);
        newSessionId = newSession._id;
      } else if (item.sessionId && item.status === "pending") {
        // Start a planned replacement session
        await sessionsApi.updateStatus(item.sessionId, "active");
      }
      await mutate();
      if (newSessionId) {
        router.push(`/sessions/${newSessionId}/live`);
      }
    } catch (err) {
      console.error("Failed to start session:", err);
      alert(t.common.error);
    } finally {
      setStartingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "active")
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 font-medium">{t.sessions.inProgress}</Badge>;
    if (status === "pending")
      return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 font-medium">{t.sessions.planned}</Badge>;
    return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 font-medium">{t.sessions.closed}</Badge>;
  };

  return (
    <div className="flex flex-col space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {t.dashboard.welcome} {user?.fullName || "Teacher"} 👋
        </h1>
        <p className="text-gray-500 mt-1">{t.dashboard.subtitle}</p>
      </div>

      <StatsCards sessions={sessions ?? []} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AttendanceChart sessions={sessions ?? []} />

        <Card className="shadow-sm border-gray-200 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold text-gray-800">{t.dashboard.todaysSessions}</CardTitle>
            <Link href="/sessions" className="text-sm text-violet-600 font-medium hover:underline">
              {t.common.viewAll}
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {isLoading ? (
              <div className="space-y-3 mt-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3 mt-2">
                {displayedItems.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">{t.dashboard.noSessionsToday}</p>
                )}
                {displayedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col bg-gray-50/50 rounded-lg p-3 relative overflow-hidden border border-gray-100"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`} />
                    <div className="flex justify-between items-start pl-2">
                      <div>
                        <span className="text-xs font-bold text-violet-700">
                          {item.startTime} - {item.endTime}
                        </span>
                        <h4 className="text-sm font-bold text-gray-900 mt-0.5">
                          {getModuleName(item.moduleId)}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.group ? `${t.sessions.group} ${item.group}` : t.schedule.allGroups} / {item.type.toUpperCase()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(item.status)}
                        {item.status === "pending" && (
                          <Button 
                            size="sm" 
                            className="h-7 text-xs bg-violet-600 hover:bg-violet-700"
                            onClick={() => handleStartSession(item)}
                            disabled={startingId === item.id}
                          >
                            {startingId === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Play className="h-3 w-3 mr-1 fill-current" />
                                {t.sessions.start}
                              </>
                            )}
                          </Button>
                        )}
                        {(item.status === "active" || item.status === "closed") && item.sessionId && (
                          <Link href={`/sessions/${item.sessionId}/live`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs">
                              {t.sessions.view}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity sessions={sessions ?? []} />

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold text-gray-800">{t.dashboard.upcoming}</CardTitle>
            <Link href="/sessions" className="text-sm text-violet-600 font-medium hover:underline">
              {t.common.viewAll}
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2 mt-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {(sessions ?? [])
                  .filter((s) => s.status === "planned")
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .slice(0, 5)
                  .map((s) => (
                    <div key={s._id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                        <span className="font-medium text-gray-900">{getModuleName(s.moduleId)}</span>
                        <span className="text-xs text-gray-500 uppercase">{s.type}</span>
                      </div>
                      <span className="text-gray-500 text-xs">
                        {format(parseISO(s.date), "EEE, MMM d")} · {s.startTime}
                      </span>
                    </div>
                  ))}
                {(sessions ?? []).filter((s) => s.status === "planned").length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">{t.sessions.noUpcoming}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
