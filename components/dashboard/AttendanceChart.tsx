"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO, startOfWeek, addDays, isAfter, startOfDay } from "date-fns";
import { useTranslation } from "@/lib/locale-context";
import type { Session } from "@/types/api";

interface AttendanceChartProps {
  sessions: Session[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AttendanceChart({ sessions }: AttendanceChartProps) {
  const { t } = useTranslation();
  const [weekOffset, setWeekOffset] = useState(0);

  // Use useSyncExternalStore to detect mounting without triggering cascading renders
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const offsetDays = weekOffset * 7;
    const weekStart = startOfWeek(offsetDays === 0 ? today : addDays(today, offsetDays), { weekStartsOn: 0 });
    
    return DAYS.map((day, i) => {
      const dayDateObj = addDays(weekStart, i);
      const dayDateStr = format(dayDateObj, "yyyy-MM-dd");
      
      const daySessions = sessions.filter(
        (s) => format(parseISO(s.date), "yyyy-MM-dd") === dayDateStr,
      );
      
      const completed = daySessions.filter(
        (s) => s.status === "active" || s.status === "closed",
      ).length;
      
      const planned = daySessions.filter(
        (s) => s.status === "planned"
      ).length;

      // Only show data if the day is not in the future, or if it has planned sessions
      const isFuture = weekOffset === 0 && isAfter(dayDateObj, today);
      
      return {
        day,
        sessions: isFuture && completed === 0 ? null : completed,
        planned: planned === 0 && isFuture ? null : planned,
      };
    });
  }, [sessions, weekOffset]);

  return (
    <Card className="lg:col-span-2 shadow-sm border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold text-gray-800">
          {t.dashboard.attendanceOverview}
        </CardTitle>
        <select
          className="text-sm border border-gray-200 rounded-md px-3 py-1.5 text-gray-600 bg-white outline-none focus:ring-2 focus:ring-violet-500"
          value={weekOffset}
          onChange={(e) => setWeekOffset(Number(e.target.value))}
        >
          <option value={0}>{t.dashboard.thisWeek}</option>
          <option value={-1}>{t.dashboard.lastWeek}</option>
        </select>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-sm text-gray-400">
            {t.common.noData}
          </div>
        ) : (
          <div className="h-[280px] min-h-[280px] w-full mt-4">
            {isMounted && (
              <ResponsiveContainer
                width="100%"
                height={280}
                debounce={50}
              >
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 13 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 13 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    connectNulls={false}
                    stroke="#7c3aed"
                    strokeWidth={3}
                    dot={{
                      r: 5,
                      fill: "#fff",
                      stroke: "#7c3aed",
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 7,
                      fill: "#7c3aed",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                    name={t.sessions.inProgress + " / " + t.sessions.closed}
                  />
                  <Line
                    type="monotone"
                    dataKey="planned"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{
                      r: 3,
                      fill: "#fff",
                      stroke: "#f59e0b",
                      strokeWidth: 2,
                    }}
                    name={t.sessions.planned}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
