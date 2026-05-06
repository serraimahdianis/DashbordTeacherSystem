"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { useApi } from "@/lib/api";
import { useTranslation } from "@/lib/locale-context";
import type { Student } from "@/types/api";

export default function StudentsPage() {
  const { t } = useTranslation();
  const { data: students, isLoading } = useApi<Student[]>("/students");
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");

  const allStudents = useMemo(() => students ?? [], [students]);

  const uniqueYears = [...new Set(allStudents.map((s) => s.year))].sort();
  const uniqueGroups = [...new Set(allStudents.map((s) => s.group))].sort();

  const filteredStudents = allStudents.filter((s) => {
    const matchesSearch =
      searchQuery === "" ||
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rfidCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = yearFilter === "" || s.year === yearFilter;
    const matchesGroup = groupFilter === "" || s.group === groupFilter;
    return matchesSearch && matchesYear && matchesGroup;
  });

  return (
    <div className="flex flex-col space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t.nav.students}</h1>
          <p className="text-gray-500 mt-1">{t.sessions.subtitle}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t.common.search + "..."}
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <select
            className="h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-violet-500"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <option value="">{t.schedule.allYears}</option>
            {uniqueYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-violet-500"
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

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="font-bold text-gray-900">{t.nav.students}</TableHead>
                <TableHead className="font-bold text-gray-900">ID</TableHead>
                <TableHead className="font-bold text-gray-900">{t.schedule.year}</TableHead>
                <TableHead className="font-bold text-gray-900">{t.sessions.group}</TableHead>
                <TableHead className="font-bold text-gray-900">Speciality</TableHead>
                <TableHead className="font-bold text-gray-900">RFID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <div className="h-4 w-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                      {t.common.loading}
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    {t.common.noData}
                  </TableCell>
                </TableRow>
              )}
              {filteredStudents.map((student) => {
                const initials = student.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <TableRow key={student._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <TableCell className="flex items-center gap-3 py-4">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-violet-100 text-violet-700 font-bold text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-semibold text-gray-900">{student.fullName}</span>
                        <p className="text-xs text-gray-500">{student.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 font-mono text-sm">
                      {student.studentId}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-violet-50 text-violet-600 border-transparent font-bold">
                        {student.year}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {t.sessions.group} {student.group}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {student.speciality}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-mono">
                        {student.rfidCode}
                      </code>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-100 text-sm text-gray-500">
          <div>{filteredStudents.length} / {allStudents.length} {t.common.students}</div>
        </div>
      </div>
    </div>
  );
}
