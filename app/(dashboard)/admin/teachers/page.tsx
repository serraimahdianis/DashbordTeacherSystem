"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, X, Plus, Pencil, Trash2, UserCog, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useApi } from "@/lib/api";
import { teachersApi } from "@/lib/api";
import { useSWRConfig } from "swr";
import { TeacherFormSheet } from "@/components/admin/TeacherFormSheet";
import type { Teacher, PaginatedResponse } from "@/types/api";

export default function AdminTeachersPage() {
  const { mutate } = useSWRConfig();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const limit = 15;
  const swrKey = `/teachers?page=${page}&limit=${limit}`;
  const { data, isLoading } = useApi<PaginatedResponse<Teacher>>(swrKey);

  const teachers = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const filteredTeachers = useMemo(() => {
    if (!searchQuery) return teachers;
    const q = searchQuery.toLowerCase();
    return teachers.filter(
      (t) =>
        t.fullName.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q)
    );
  }, [teachers, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this teacher? This action cannot be undone.")) return;
    setDeletingId(id);
    try {
      await teachersApi.delete(id);
      mutate(swrKey);
    } catch (err) {
      console.error("Failed to delete teacher:", err);
      alert("Failed to delete teacher.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setSheetOpen(true);
  };

  const handleAdd = () => {
    setEditingTeacher(null);
    setSheetOpen(true);
  };

  const handleSuccess = () => {
    mutate(swrKey);
  };

  return (
    <div className="flex flex-col space-y-8 max-w-[1400px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <UserCog className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Teachers</h1>
          </div>
          <p className="text-gray-500 font-medium ml-10">Manage all teacher accounts</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/80 backdrop-blur-md border-0 rounded-[2rem] px-5 py-3 flex items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="text-2xl font-bold text-gray-900">{total}</div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total</div>
          </div>
          <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-xl h-11 px-6">
            <Plus className="h-4 w-4" />
            Add Teacher
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white/80 backdrop-blur-md p-4 rounded-[2rem] border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search by name, email, or department..."
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
      </div>

      {/* Table */}
      <div className="rounded-[2rem] border-0 bg-white/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-200">
                <TableHead className="font-bold text-gray-900 py-5 pl-6">Teacher</TableHead>
                <TableHead className="font-bold text-gray-900">Department</TableHead>
                <TableHead className="font-bold text-gray-900 text-center">Status</TableHead>
                <TableHead className="font-bold text-gray-900 text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">Loading teachers...</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && filteredTeachers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center text-gray-400 space-y-4">
                      <UserCog className="h-12 w-12 opacity-20" />
                      <p className="text-gray-900 font-bold">No teachers found</p>
                      <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-xl">
                        <Plus className="h-4 w-4" /> Add First Teacher
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {filteredTeachers.map((teacher) => {
                const initials = teacher.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <TableRow key={teacher._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-all group">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold text-sm">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{teacher.fullName}</span>
                          <span className="text-xs text-gray-400">{teacher.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm font-medium">{teacher.department}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={teacher.isVerified !== false ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"}>
                        {teacher.isVerified !== false ? "Verified" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200" onClick={() => handleEdit(teacher)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50" onClick={() => handleDelete(teacher._id)} disabled={deletingId === teacher._id}>
                          {deletingId === teacher._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
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
      <TeacherFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        teacher={editingTeacher}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
