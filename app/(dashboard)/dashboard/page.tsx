"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Play, Clock, Loader2, ChevronRight, Eye } from "lucide-react";
import { parseISO, isToday, isAfter, startOfDay } from "date-fns";
import { formatDate } from "@/lib/utils";
import { useApi, sessionsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/locale-context";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { getModuleName } from "@/types/api";
import type { Session, Schedule } from "@/types/api";
import { useSWRConfig } from "swr";

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [startingId, setStartingId] = useState<string | null>(null);

  const isAdm = user?.role === "admin";
  const { data: sessionsData, isLoading: sessionsLoading } = useApi<{ data: Session[] }>(
    isAdm ? "/sessions" : user?.id ? `/sessions/teacher/${user.id}` : null
  );
  const { data: schedulesData, isLoading: schedulesLoading } = useApi<{ data: Schedule[] }>(
    isAdm ? "/schedules" : user?.id ? `/schedules/teacher/${user.id}` : null
  );

  const sessions = sessionsData?.data;
  const schedules = schedulesData?.data;

  const isLoading = sessionsLoading || schedulesLoading;

  const handleStartSession = async (item: { 
    id: string; 
    sessionId?: string; 
    scheduleId?: string | null; 
    status: string 
  }) => {
    setStartingId(item.id);
    try {
      let newSessionId = item.sessionId;
      if (item.scheduleId && !item.sessionId) {
        // Start from schedule
        const newSession = await sessionsApi.startFromSchedule(item.scheduleId);
        newSessionId = newSession._id;
      } else if (item.sessionId && (item.status === "pending" || item.status === "planned")) {
        // Start a planned session (could be pre-generated or replacement)
        await sessionsApi.updateStatus(item.sessionId, "active");
      }
      
      await mutate(user?.id ? `/sessions/teacher/${user.id}` : null);
      if (newSessionId) {
        router.push(`/sessions/${newSessionId}/live`);
      }
    } catch (err) {
      console.error("Failed to start session:", err);
    } finally {
      setStartingId(null);
    }
  };

  const displayedItems = useMemo(() => {
    if (!schedules || !sessions) return [];

    const today = new Date();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = dayNames[today.getDay()];

    const todaySchedules = schedules.filter((s) => s.dayOfWeek === todayName);
    const todaySessions = sessions.filter((s) => isToday(parseISO(s.date)));

    const items: Array<{
      id: string;
      scheduleId: string | null;
      startTime: string;
      endTime: string;
      moduleId: string;
      group: string | null;
      type: string;
      status: "pending" | "active" | "closed" | "canceled";
      sessionId?: string;
    }> = [];

    // Map schedules
    todaySchedules.forEach((sch) => {
      const session = todaySessions.find((s) => s.scheduleId === sch._id);
      items.push({
        id: sch._id,
        scheduleId: sch._id,
        startTime: sch.startTime,
        endTime: sch.endTime,
        moduleId: sch.moduleId as string,
        group: sch.group,
        type: sch.type,
        status: session 
          ? (session.status === "planned" ? "pending" : session.status as "active" | "closed" | "canceled") 
          : "pending",
        sessionId: session?._id,
      });
    });

    // Add replacement sessions for today
    todaySessions.forEach((sess) => {
      if (!sess.scheduleId || !todaySchedules.find((s) => s._id === sess.scheduleId)) {
        items.push({
          id: sess._id,
          scheduleId: sess.scheduleId,
          startTime: sess.startTime,
          endTime: sess.endTime,
          moduleId: sess.moduleId as string,
          group: sess.group,
          type: sess.type,
          status: sess.status === "planned" ? "pending" : sess.status as "active" | "closed" | "canceled",
          sessionId: sess._id,
        });
      }
    });

    return items.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [schedules, sessions]);

  const getStatusBadge = (status: string) => {
    if (status === "active")
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 font-medium">{t.sessions.inProgress}</Badge>;
    if (status === "pending")
      return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 font-medium">{t.sessions.planned}</Badge>;
    if (status === "canceled")
      return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 font-medium line-through">{t.sessions.canceled}</Badge>;
    return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 font-medium">{t.sessions.closed}</Badge>;
  };

  const upcomingItems = useMemo(() => {
    if (!sessions || !schedules) return [];
    
    const now = new Date();
    const today = startOfDay(now);
    // 1. Get all planned session objects for today and future
    const plannedSessions = sessions.filter(s => 
      s.status === "planned" && 
      (isAfter(parseISO(s.date), today) || isToday(parseISO(s.date)))
    );

    // 2. Identify future schedules (not today, as today's are in the top list)
    // For simplicity, let's just show the next 5 planned sessions
    // If there are few planned sessions, it might look empty, but it's accurate
    
    return plannedSessions
      .sort((a, b) => {
        const dateComp = a.date.localeCompare(b.date);
        if (dateComp !== 0) return dateComp;
        return a.startTime.localeCompare(b.startTime);
      })
      .slice(0, 5);
  }, [sessions, schedules]);

  return (
    <div className="flex flex-col space-y-8 max-w-[1400px] mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Hello, {user?.fullName || "Teacher"} 👋
        </h1>
        <p className="text-gray-500 mt-1">{t.dashboard.welcome}</p>
      </div>

      <StatsCards sessions={sessions ?? []} schedules={schedules ?? []} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <AttendanceChart sessions={sessions ?? []} />

        <Card className="flex flex-col h-full overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4 bg-gray-50/30">
            <CardTitle className="text-lg font-bold text-gray-800">{t.dashboard.todaysSessions}</CardTitle>
            <Link href="/sessions" className="text-sm text-violet-600 font-semibold hover:underline flex items-center gap-1">
              {t.common.viewAll}
              <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : displayedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 p-6 text-center">
                <CalendarDays className="h-12 w-12 mb-3 opacity-20" />
                <p>{t.dashboard.noSessionsToday}</p>
              </div>
            ) : (
              <div className="max-h-[450px] overflow-y-auto">
                {displayedItems.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50/50 transition-colors relative group">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-1.5 ${
                      item.status === "active" ? "bg-emerald-500" : 
                      item.status === "canceled" ? "bg-red-400" : 
                      item.status === "closed" ? "bg-gray-300" : "bg-amber-400"
                    }`} />
                    <div className="flex justify-between items-start pl-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900 leading-tight">
                            {getModuleName(item.moduleId)}
                          </span>
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 uppercase font-bold border-gray-200 text-gray-500">
                            {item.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.startTime} - {item.endTime}
                          </div>
                          {item.group && (
                            <div className="flex items-center gap-1 font-medium">
                              <Badge variant="outline" className="text-[10px] h-4 px-1 border-violet-100 text-violet-600 bg-violet-50/30">
                                G{item.group}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(item.status)}
                        {item.status === "pending" && (
                          <Button 
                            size="sm" 
                            className="h-7 text-xs bg-violet-600 hover:bg-violet-700 shadow-sm"
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
                            <Button size="sm" variant="outline" className="h-7 text-xs border-violet-200 text-violet-700 hover:bg-violet-50">
                              {item.status === "active" ? (
                                <><Play className="h-3 w-3 mr-1 fill-current" /> {t.sessions.view}</>
                              ) : (
                                <><Eye className="h-3 w-3 mr-1" /> {t.sessions.view}</>
                              )}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentActivity sessions={sessions ?? []} />

        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4 bg-gray-50/30">
            <CardTitle className="text-lg font-bold text-gray-800">{t.dashboard.upcoming}</CardTitle>
            <Link href="/sessions" className="text-sm text-violet-600 font-semibold hover:underline">
              {t.common.viewAll}
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {isLoading ? (
              <div className="space-y-3 mt-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="mt-2 space-y-1">
                {upcomingItems.map((s) => (
                  <div key={s._id} className="flex items-center justify-between py-3 mb-1 hover:bg-gray-50/80 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600">
                        <CalendarDays className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-sm">{getModuleName(s.moduleId)}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{s.type}</span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-gray-900 text-sm font-semibold">
                        {formatDate(s.date, "EEE, MMM d")}
                      </span>
                      <span className="text-gray-400 text-[11px]">
                        {s.startTime}
                      </span>
                    </div>
                  </div>
                ))}
                {upcomingItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Clock className="h-10 w-10 mb-2 opacity-10" />
                    <p className="text-sm">{t.sessions.noUpcoming}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
