"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, X, Filter, Users, GraduationCap, School } from "lucide-react";
import { useApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/locale-context";
import type { Student, Schedule } from "@/types/api";

export default function StudentsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const { data: studentsData, isLoading: loadingStudents } = useApi<{ data: Student[] }>("/students?limit=500");

  const students = studentsData?.data;

  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");

  const allStudents = useMemo(() => students ?? [], [students]);

  const uniqueYears = useMemo(() => [...new Set(allStudents.map((s) => s.year))].sort(), [allStudents]);
  const uniqueGroups = useMemo(() => [...new Set(allStudents.map((s) => (s.group?.toString() ?? '').trim()))].filter(Boolean).sort(), [allStudents]);

  const teacherGroups = useMemo(() => {
    return new Set(user?.groups?.map((g) => g.trim()) ?? []);
  }, [user?.groups]);

  const filteredStudents = useMemo(() => {
    return allStudents.filter((s) => {
      const studentGroup = (s.group?.toString() ?? '').trim();
      const matchesSearch =
        searchQuery === "" ||
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rfidCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesYear = yearFilter === "" || s.year === yearFilter;
      const matchesGroup = groupFilter === "" || studentGroup === groupFilter.trim();
      
      return matchesSearch && matchesYear && matchesGroup;
    });
  }, [allStudents, searchQuery, yearFilter, groupFilter]);

  const isLoading = loadingStudents;
  const hasActiveFilters = searchQuery !== "" || yearFilter !== "" || groupFilter !== "";

  const clearAllFilters = () => {
    setSearchQuery("");
    setYearFilter("");
    setGroupFilter("");
  };

  return (
    <div className="flex flex-col space-y-8 max-w-[1400px] mx-auto pb-10">
      {/* Page Title & Stats Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-violet-600 rounded-lg text-white">
              <Users className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{t.nav.students}</h1>
          </div>
          <p className="text-gray-500 font-medium ml-10">
            {t.sessions.subtitle}
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-white/80 backdrop-blur-md border-0 rounded-[2rem] p-4 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] min-w-[180px]">
            <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{filteredStudents.length}</div>
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Filtered</div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-md border-0 rounded-[2rem] p-4 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] min-w-[180px]">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <School className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{allStudents.length}</div>
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Search & Filter Controls */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
        <div className="flex flex-col xl:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder={`${t.common.search || "Search"} name, ID, or RFID...`}
              className="pl-12 pr-10 bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all h-12 text-base rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap md:flex-nowrap gap-3 w-full xl:w-auto">

            <select
              className="h-12 rounded-2xl border-0 bg-gray-50/50 px-4 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-violet-500/20 font-bold cursor-pointer min-w-[140px]"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="">{t.schedule.allYears}</option>
              {uniqueYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            
            <select
              className="h-12 rounded-2xl border-0 bg-gray-50/50 px-4 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-violet-500/20 font-bold cursor-pointer min-w-[140px]"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
            >
              <option value="">{t.schedule.allGroups}</option>
              {uniqueGroups.map((g) => (
                <option key={g} value={g}>{t.sessions.group} {g}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 py-1">
          <div className="flex items-center gap-2 mr-2">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <Filter className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Groups</span>
          </div>
          
          <button
            onClick={() => setGroupFilter("")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
              groupFilter === "" 
                ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200" 
                : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
            }`}
          >
            All
          </button>
          
          {uniqueGroups.map((g) => {
            const isTeacherGroup = teacherGroups.has(g);
            return (
              <button
                key={g}
                onClick={() => setGroupFilter(groupFilter === g ? "" : g)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${
                  groupFilter === g 
                    ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200" 
                    : isTeacherGroup 
                      ? "bg-violet-50 text-violet-700 border-violet-100 hover:bg-violet-100 hover:border-violet-200"
                      : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
                }`}
              >
                {t.sessions.group} {g}
                {isTeacherGroup && <div className={`h-1 w-1 rounded-full ${groupFilter === g ? "bg-white" : "bg-violet-400"}`} />}
              </button>
            );
          })}
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="ml-auto text-xs text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-4 gap-1.5 font-bold rounded-full border border-transparent hover:border-red-100"
            >
              <X className="h-3.5 w-3.5" />
              Reset All
            </Button>
          )}
        </div>
      </div>

      {/* Student Directory Table Container */}
      <div className="rounded-[2rem] border-0 bg-white/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-200">
                <TableHead className="font-bold text-gray-900 py-5 pl-6">{t.nav.students}</TableHead>
                <TableHead className="font-bold text-gray-900">ID</TableHead>
                <TableHead className="font-bold text-gray-900 text-center">{t.schedule.year}</TableHead>
                <TableHead className="font-bold text-gray-900 text-center">{t.sessions.group}</TableHead>
                <TableHead className="font-bold text-gray-900">Speciality</TableHead>
                <TableHead className="font-bold text-gray-900 text-right pr-6">Hardware Identifier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="h-10 w-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">
                        Synchronizing Roster...
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              
              {!isLoading && filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center text-gray-400 space-y-4">
                      <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center">
                        <Users className="h-8 w-8 opacity-20" />
                      </div>
                      <div className="max-w-[300px]">
                        <p className="text-gray-900 font-bold">No results found</p>
                        <p className="text-sm mt-1">
                          We couldn&apos;t find any students matching your current selection.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-violet-600 border-violet-200 font-bold rounded-xl"
                      >
                        Reset filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              
              {filteredStudents.map((student) => {
                const studentGroup = student.group?.toString().trim();
                const initials = student.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                
                const isTeached = user?.role === 'teacher' && (
                  (!user.years || user.years.length === 0 || user.years.includes(student.year)) &&
                  (!user.groups || user.groups.length === 0 || user.groups.some(g => g.trim() === (student.group?.toString() ?? '').trim())) &&
                  (!user.specialities || user.specialities.length === 0 || user.specialities.some(s => s.trim() === (student.speciality ?? '').trim()))
                );

                return (
                  <TableRow 
                    key={student._id} 
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-all group"
                  >
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-11 w-11 border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-violet-700 text-white font-bold text-sm shadow-inner">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 group-hover:text-violet-700 transition-colors">
                            {student.fullName}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">{student.email}</span>
                        </div>
                        {isTeached && (
                          <div className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 border-none text-[10px] h-4 px-1.5 font-bold uppercase tracking-tighter">
                              My Student
                            </Badge>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-900 font-mono text-sm font-bold opacity-60 group-hover:opacity-100">
                      {student.studentId}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-white text-gray-600 border-gray-200 font-bold text-xs px-3 py-1 rounded-lg">
                        {student.year}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-100 font-extrabold text-xs px-3 py-1 rounded-lg">
                        G{student.group}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm font-medium">
                      {student.speciality}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="inline-flex items-center gap-2 bg-gray-50 border-0 px-3 py-1.5 rounded-xl text-gray-400 font-mono text-[10px] group-hover:bg-white group-hover:text-violet-600 transition-all shadow-sm">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="24" height="24" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="h-3.5 w-3.5 opacity-50"
                        >
                          <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
                        </svg>
                        {student.rfidCode}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Premium Footer Info Panel */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-gray-50/20 gap-4">
          <div className="text-sm font-medium text-gray-400">
            Showing <span className="text-gray-900 font-bold">{filteredStudents.length}</span> results 
            from <span className="text-gray-900 font-bold">{allStudents.length}</span> entries 
            in the <span className="italic">&quot;{user?.department || "University"}&quot;</span> database.
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-7 w-7 rounded-full border-2 border-white bg-gray-200 animate-pulse" />
              ))}
              <div className="h-7 w-7 rounded-full border-2 border-white bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white">
                +{allStudents.length > 4 ? allStudents.length - 4 : 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
