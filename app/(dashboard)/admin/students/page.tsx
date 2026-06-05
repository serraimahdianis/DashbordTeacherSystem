"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, X, Plus, Pencil, Trash2, GraduationCap, Loader2, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { useApi, studentsApi } from "@/lib/api";
import { useSWRConfig } from "swr";
import { StudentFormSheet } from "@/components/admin/StudentFormSheet";
import type { Student, PaginatedResponse } from "@/types/api";

export default function AdminStudentsPage() {
  const { mutate } = useSWRConfig();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [specialityFilter, setSpecialityFilter] = useState("");

  const limit = 20;
  const swrKey = `/students?page=${page}&limit=${limit}`;
  const { data, isLoading } = useApi<PaginatedResponse<Student>>(swrKey);

  const students = useMemo(() => data?.data ?? [], [data?.data]);
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const uniqueYears = useMemo(() => [...new Set(students.map((s) => s.year))].sort(), [students]);
  const uniqueGroups = useMemo(() => [...new Set(students.map((s) => s.group?.toString().trim()).filter(Boolean))].sort(), [students]);
  const uniqueSpecialities = useMemo(() => [...new Set(students.map((s) => s.speciality?.toString().trim()).filter(Boolean))].sort(), [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.rfidCode.toLowerCase().includes(q);
      const matchesYear = !yearFilter || s.year === yearFilter;
      const matchesGroup = !groupFilter || s.group?.toString().trim() === groupFilter;
      const matchesSpeciality = !specialityFilter || s.speciality?.toString().trim() === specialityFilter;
      return matchesSearch && matchesYear && matchesGroup && matchesSpeciality;
    });
  }, [students, searchQuery, yearFilter, groupFilter, specialityFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student? This action cannot be undone.")) return;
    setDeletingId(id);
    try {
      await studentsApi.delete(id);
      mutate(swrKey);
    } catch (err) {
      console.error("Failed to delete student:", err);
      alert("Failed to delete student.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setSheetOpen(true);
  };

  const handleAdd = () => {
    setEditingStudent(null);
    setSheetOpen(true);
  };

  const handleSuccess = () => {
    mutate(swrKey);
  };

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const hasFilters = searchQuery || yearFilter || groupFilter || specialityFilter;

  return (
    <div className="flex flex-col space-y-8 max-w-[1400px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-emerald-600 rounded-lg text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Students</h1>
          </div>
          <p className="text-gray-500 font-medium ml-10">Manage all student accounts</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/80 backdrop-blur-md border-0 rounded-[2rem] px-5 py-3 flex items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="text-2xl font-bold text-gray-900">{total}</div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total</div>
          </div>
          <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-xl h-11 px-6">
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4">
        <div className="flex flex-col xl:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by name, email, student ID, or RFID..."
              className="pl-12 pr-10 bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 h-12 text-base rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-3 w-full xl:w-auto">
            <select
              className="h-12 rounded-2xl border-0 bg-gray-50/50 px-4 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold cursor-pointer min-w-[130px]"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="">All Years</option>
              {uniqueYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              className="h-12 rounded-2xl border-0 bg-gray-50/50 px-4 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold cursor-pointer min-w-[130px]"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
            >
              <option value="">All Groups</option>
              {uniqueGroups.map((g) => (
                <option key={g} value={g}>Group {g}</option>
              ))}
            </select>
            <select
              className="h-12 rounded-2xl border-0 bg-gray-50/50 px-4 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold cursor-pointer min-w-[150px]"
              value={specialityFilter}
              onChange={(e) => setSpecialityFilter(e.target.value)}
            >
              <option value="">All Specialities</option>
              {uniqueSpecialities.map((sp) => (
                <option key={sp} value={sp}>{sp}</option>
              ))}
            </select>
          </div>
        </div>

        {hasFilters && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              Showing <span className="font-bold text-gray-900">{filteredStudents.length}</span> of {students.length} on this page
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearchQuery(""); setYearFilter(""); setGroupFilter(""); setSpecialityFilter(""); }}
              className="ml-auto text-xs text-red-500 hover:text-red-600 hover:bg-red-50 h-7 px-3 gap-1 font-bold rounded-full"
            >
              <X className="h-3 w-3" /> Reset
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-[2rem] border-0 bg-white/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-200">
                <TableHead className="font-bold text-gray-900 py-5 pl-6">Student</TableHead>
                <TableHead className="font-bold text-gray-900">ID</TableHead>
                <TableHead className="font-bold text-gray-900 text-center">Year</TableHead>
                <TableHead className="font-bold text-gray-900 text-center">Group</TableHead>
                <TableHead className="font-bold text-gray-900">Speciality</TableHead>
                <TableHead className="font-bold text-gray-900 text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">Loading students...</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center text-gray-400 space-y-4">
                      <GraduationCap className="h-12 w-12 opacity-20" />
                      <p className="text-gray-900 font-bold">No students found</p>
                      <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-xl">
                        <Plus className="h-4 w-4" /> Add First Student
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {filteredStudents.map((student) => {
                const initials = student.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <TableRow key={student._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-all group">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-bold text-sm">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{student.fullName}</span>
                          <span className="text-xs text-gray-400">{student.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-900 font-mono text-sm font-bold opacity-60">{student.studentId}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-white text-gray-600 border-gray-200 font-bold">{student.year}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-extrabold">G{student.group}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm font-medium">{student.speciality}</TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200" onClick={() => handleEdit(student)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50" onClick={() => handleDelete(student._id)} disabled={deletingId === student._id}>
                          {deletingId === student._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-6 bg-gray-50/20 border-t border-gray-100">
            <div className="text-sm text-gray-400">
              Page <span className="font-bold text-gray-900">{page}</span> of <span className="font-bold text-gray-900">{totalPages}</span>
              {" — "}<span className="font-bold text-gray-900">{total}</span> total entries
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-lg" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Form Sheet */}
      <StudentFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        student={editingStudent}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
