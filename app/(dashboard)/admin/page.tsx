"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Users, UserCog, BookOpen, CalendarDays, Plus, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Teacher, Student, PaginatedResponse } from "@/types/api";

export default function AdminOverviewPage() {
  const { user } = useAuth();

  const { data: teachersData, isLoading: loadingTeachers } = useApi<PaginatedResponse<Teacher>>("/teachers?page=1&limit=5");
  const { data: studentsData, isLoading: loadingStudents } = useApi<PaginatedResponse<Student>>("/students?page=1&limit=5");
  const { data: modulesData } = useApi<PaginatedResponse<{ _id: string }>>("/modules?page=1&limit=1");
  const { data: sessionsData } = useApi<PaginatedResponse<{ _id: string }>>("/sessions?page=1&limit=1");

  const totalTeachers = teachersData?.total ?? 0;
  const totalStudents = studentsData?.total ?? 0;
  const totalModules = modulesData?.total ?? 0;
  const totalSessions = sessionsData?.total ?? 0;

  const recentTeachers = teachersData?.data ?? [];
  const recentStudents = studentsData?.data ?? [];

  const isLoading = loadingTeachers || loadingStudents;

  const stats = [
    { label: "Total Teachers", value: totalTeachers, icon: UserCog, color: "bg-blue-50 text-blue-600", ring: "shadow-blue-100" },
    { label: "Total Students", value: totalStudents, icon: Users, color: "bg-emerald-50 text-emerald-600", ring: "shadow-emerald-100" },
    { label: "Total Modules", value: totalModules, icon: BookOpen, color: "bg-amber-50 text-amber-600", ring: "shadow-amber-100" },
    { label: "Total Sessions", value: totalSessions, icon: CalendarDays, color: "bg-violet-50 text-violet-600", ring: "shadow-violet-100" },
  ];

  return (
    <div className="flex flex-col space-y-8 max-w-[1400px] mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Welcome, {user?.fullName ?? "Admin"} 👋
        </h1>
        <p className="text-gray-500 mt-1">System overview and quick actions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`bg-white/80 backdrop-blur-md rounded-[2rem] p-6 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${stat.ring}`}
          >
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/teachers">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-xl h-11 px-6">
            <Plus className="h-4 w-4" />
            Add Teacher
          </Button>
        </Link>
        <Link href="/admin/students">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-xl h-11 px-6">
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </Link>
      </div>

      {/* Recent Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Teachers */}
        <Card className="overflow-hidden rounded-[2rem] border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <CardHeader className="flex flex-row items-center justify-between pb-4 bg-gray-50/30">
            <CardTitle className="text-lg font-bold text-gray-800">Recent Teachers</CardTitle>
            <Link href="/admin/teachers" className="text-sm text-indigo-600 font-semibold hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : recentTeachers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <UserCog className="h-10 w-10 opacity-20 mb-2" />
                <p className="text-sm">No teachers yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTeachers.map((teacher) => {
                    const initials = teacher.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                    return (
                      <TableRow key={teacher._id}>
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{teacher.fullName}</div>
                              <div className="text-xs text-gray-400">{teacher.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{teacher.department}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={teacher.isVerified !== false ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"}>
                            {teacher.isVerified !== false ? "Verified" : "Pending"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Students */}
        <Card className="overflow-hidden rounded-[2rem] border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <CardHeader className="flex flex-row items-center justify-between pb-4 bg-gray-50/30">
            <CardTitle className="text-lg font-bold text-gray-800">Recent Students</CardTitle>
            <Link href="/admin/students" className="text-sm text-emerald-600 font-semibold hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : recentStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Users className="h-10 w-10 opacity-20 mb-2" />
                <p className="text-sm">No students yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Name</TableHead>
                    <TableHead className="text-center">Year</TableHead>
                    <TableHead className="text-center">Group</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentStudents.map((student) => {
                    const initials = student.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                    return (
                      <TableRow key={student._id}>
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{student.fullName}</div>
                              <div className="text-xs text-gray-400">{student.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-white text-gray-600 border-gray-200 font-bold">{student.year}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-extrabold">G{student.group}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
