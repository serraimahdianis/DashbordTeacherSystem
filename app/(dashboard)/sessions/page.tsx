"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, Play, Eye, CheckCircle2, ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useApi, sessionsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/locale-context";
import type { Session, Module } from "@/types/api";
import { getModuleName } from "@/types/api";
import { useSWRConfig } from "swr";

export default function SessionsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { mutate } = useSWRConfig();
  const swrKey = user?.id ? `/sessions/teacher/${user.id}` : null;
  const { data: sessions, isLoading } = useApi<Session[]>(swrKey);
  const { data: modules } = useApi<Module[]>(user?.id ? `/modules/teacher/${user.id}` : null);

  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");
  const [moduleFilter, setModuleFilter] = useState(t.sessions.allModules);
  
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [moduleSheetOpen, setModuleSheetOpen] = useState(false);
  const [moduleSaving, setModuleSaving] = useState(false);
  const [moduleFormError, setModuleFormError] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState({ name: "", year: "" });

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setModuleFormError(null);
    setModuleSaving(true);
    try {
      await import("@/lib/api").then((m) => m.modulesApi.create({
        name: moduleForm.name,
        year: moduleForm.year,
        teacherId: user.id,
      }));
      await mutate(user?.id ? `/modules/teacher/${user.id}` : null);
      setModuleSheetOpen(false);
      setModuleForm({ name: "", year: "" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setModuleFormError(typeof msg === "string" ? msg : "Failed to save module.");
    } finally {
      setModuleSaving(false);
    }
  };
  
  const [form, setForm] = useState({
    moduleId: "",
    date: "",
    startTime: "",
    endTime: "",
    type: "",
    group: "",
    reasonForReplacement: "",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setFormError(null);
    setSaving(true);
    try {
      await sessionsApi.createReplacement({
        teacherId: user.id,
        moduleId: form.moduleId,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        type: form.type,
        group: form.group || null,
        status: "planned",
        isReplacement: true,
        reasonForReplacement: form.reasonForReplacement || "Extra session",
      });
      await mutate(swrKey);
      setSheetOpen(false);
      setForm({ moduleId: "", date: "", startTime: "", endTime: "", type: "", group: "", reasonForReplacement: "" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(typeof msg === "string" ? msg : "Failed to create replacement session.");
    } finally {
      setSaving(false);
    }
  };

  const allSessions = sessions ?? [];

  const upcomingSessions = allSessions
    .filter((s) => s.status === "planned" || s.status === "active")
    .sort((a, b) => a.date.localeCompare(b.date));

  const completedSessions = allSessions
    .filter((s) => s.status === "closed")
    .sort((a, b) => b.date.localeCompare(a.date));

  const displayedSessions = activeTab === "upcoming" ? upcomingSessions : completedSessions;

  const moduleNames = [t.sessions.allModules, ...new Set(allSessions.map((s) => getModuleName(s.moduleId)))];

  const filteredSessions =
    moduleFilter === t.sessions.allModules
      ? displayedSessions
      : displayedSessions.filter((s) => getModuleName(s.moduleId) === moduleFilter);

  const getTypeBadgeClass = (type: string) => {
    if (type === "td") return "bg-emerald-50 text-emerald-600 border-transparent font-bold";
    if (type === "cours") return "bg-blue-50 text-blue-600 border-transparent font-bold";
    return "bg-violet-50 text-violet-600 border-transparent font-bold";
  };

  const getStatusBadge = (status: string) => {
    if (status === "active")
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-transparent font-medium">{t.sessions.inProgress}</Badge>;
    if (status === "planned")
      return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-transparent font-medium">{t.sessions.planned}</Badge>;
    return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-transparent font-medium">{t.sessions.closed}</Badge>;
  };

  return (
    <div className="flex flex-col space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t.sessions.title}</h1>
          <p className="text-gray-500 mt-1">{t.sessions.subtitle}</p>
        </div>

        <div className="flex gap-3">
          <Sheet open={moduleSheetOpen} onOpenChange={setModuleSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="text-violet-600 border-violet-200 hover:bg-violet-50 shadow-sm font-medium h-10 px-4 gap-2">
                <Plus className="h-4 w-4" />
                New Module
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader className="text-left mb-6">
                <SheetTitle className="text-xl font-bold">Create New Module</SheetTitle>
                <SheetDescription className="text-gray-500">
                  Add a new subject to your teaching list.
                </SheetDescription>
              </SheetHeader>
              <form className="space-y-5" onSubmit={handleSaveModule}>
                {moduleFormError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                    {moduleFormError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Module Name <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="e.g. Web Development"
                    required
                    className="h-10 border-gray-200"
                    value={moduleForm.name}
                    onChange={(e) => setModuleForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Year <span className="text-red-500">*</span></Label>
                  <select
                    required
                    className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-violet-500"
                    value={moduleForm.year}
                    onChange={(e) => setModuleForm((p) => ({ ...p, year: e.target.value }))}
                  >
                    <option value="">Select Year</option>
                    {["L1", "L2", "L3", "M1", "M2"].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <Button type="button" variant="outline" className="text-gray-700" onClick={() => setModuleSheetOpen(false)}>
                    {t.common.cancel}
                  </Button>
                  <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white font-medium" disabled={moduleSaving}>
                    {moduleSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t.common.loading}</> : "Save Module"}
                  </Button>
                </div>
              </form>
            </SheetContent>
          </Sheet>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm font-medium h-10 px-4 gap-2">
              <Plus className="h-4 w-4" />
              Add Extra Session
            </Button>
          </SheetTrigger>

          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader className="text-left mb-6">
              <SheetTitle className="text-xl font-bold">Add Extra/Replacement Session</SheetTitle>
              <SheetDescription className="text-gray-500">
                Create a one-off session outside your regular weekly schedule.
              </SheetDescription>
            </SheetHeader>

            <form className="space-y-5" onSubmit={handleSave}>
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {formError}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">{t.sessions.module} <span className="text-red-500">*</span></Label>
                <select
                  required
                  className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-violet-500"
                  value={form.moduleId}
                  onChange={(e) => setForm((p) => ({ ...p, moduleId: e.target.value }))}
                >
                  <option value="">{t.sessions.module}</option>
                  {(modules ?? []).map((m) => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">{t.sessions.type} <span className="text-red-500">*</span></Label>
                <select
                  required
                  className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-violet-500"
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                >
                  <option value="">{t.sessions.type}</option>
                  <option value="cours">Cours</option>
                  <option value="td">TD</option>
                  <option value="tp">TP</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">{t.sessions.date} <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  required
                  className="h-10 border-gray-200"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">{t.sessions.time} <span className="text-red-500">*</span></Label>
                <div className="flex gap-4 items-center">
                  <Input
                    type="time"
                    required
                    className="h-10 border-gray-200"
                    value={form.startTime}
                    onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                  />
                  <span className="text-gray-400 text-sm">→</span>
                  <Input
                    type="time"
                    required
                    className="h-10 border-gray-200"
                    value={form.endTime}
                    onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Reason</Label>
                <Input
                  placeholder="e.g. Extra revision class before exams"
                  className="h-10 border-gray-200"
                  value={form.reasonForReplacement}
                  onChange={(e) => setForm((p) => ({ ...p, reasonForReplacement: e.target.value }))}
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="text-gray-700"
                  onClick={() => setSheetOpen(false)}
                >
                  {t.common.cancel}
                </Button>
                <Button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-700 text-white font-medium"
                  disabled={saving}
                >
                  {saving ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t.common.loading}</>
                  ) : (
                    "Save Session"
                  )}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-px">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`flex items-center gap-2 pb-3 border-b-2 text-sm transition-colors ${
              activeTab === "upcoming"
                ? "border-violet-600 text-violet-700 font-bold"
                : "border-transparent text-gray-500 font-medium hover:text-gray-700"
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            {t.sessions.upcoming} ({upcomingSessions.length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`flex items-center gap-2 pb-3 border-b-2 text-sm transition-colors ${
              activeTab === "completed"
                ? "border-violet-600 text-violet-700 font-bold"
                : "border-transparent text-gray-500 font-medium hover:text-gray-700"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            {t.sessions.completed} ({completedSessions.length})
          </button>
        </div>
        <div className="mb-2">
          <select
            className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-violet-500 min-w-[150px]"
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
          >
            {moduleNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className={`bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden ${activeTab === "upcoming" ? "border-l-4 border-l-violet-600" : "border-l-4 border-l-emerald-500"}`}>
          <div className={`p-5 border-b border-gray-100 flex items-center gap-3`}>
            {activeTab === "upcoming" ? (
              <>
                <CalendarDays className="h-5 w-5 text-violet-600" />
                <h2 className="text-lg font-bold text-violet-700">{t.sessions.upcoming}</h2>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <h2 className="text-lg font-bold text-emerald-600">{t.sessions.completed}</h2>
              </>
            )}
            <div className={`font-bold text-xs h-5 w-5 rounded-full flex items-center justify-center ${activeTab === "upcoming" ? "bg-violet-100 text-violet-700" : "bg-emerald-100 text-emerald-600"}`}>
              {filteredSessions.length}
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                    <TableHead className="font-bold text-gray-900 py-4">{t.sessions.module}</TableHead>
                    <TableHead className="font-bold text-gray-900">{t.sessions.type}</TableHead>
                    <TableHead className="font-bold text-gray-900">{t.sessions.group}</TableHead>
                    <TableHead className="font-bold text-gray-900">{t.sessions.date}</TableHead>
                    <TableHead className="font-bold text-gray-900">{t.sessions.time}</TableHead>
                    <TableHead className="font-bold text-gray-900">{t.sessions.status}</TableHead>
                    <TableHead className="font-bold text-gray-900">{t.sessions.action}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                        {activeTab === "upcoming" ? t.sessions.noUpcoming : t.sessions.noCompleted}
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredSessions.map((session) => (
                    <TableRow key={session._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <TableCell className="font-semibold text-gray-900 py-4">
                        {getModuleName(session.moduleId)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getTypeBadgeClass(session.type)}>
                          {session.type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {session.group ? `${t.sessions.group} ${session.group}` : "—"}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                          {format(parseISO(session.date), "MMM d, yyyy (EEE)")}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {session.startTime} - {session.endTime}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(session.status)}
                      </TableCell>
                      <TableCell>
                        {session.status === "active" ? (
                          <Link href={`/sessions/${session._id}/live`}>
                            <Button className="bg-violet-600 hover:bg-violet-700 text-white font-medium h-8 px-3 gap-1.5 text-xs">
                              <Play className="h-3 w-3 fill-current" />
                              {t.sessions.view}
                            </Button>
                          </Link>
                        ) : session.status === "planned" ? (
                          <Button 
                            className="bg-violet-600 hover:bg-violet-700 text-white font-medium h-8 px-3 gap-1.5 text-xs"
                            onClick={async () => {
                              try {
                                await sessionsApi.updateStatus(session._id, "active");
                                window.location.href = `/sessions/${session._id}/live`;
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                          >
                            <Play className="h-3 w-3 fill-current" />
                            {t.sessions.start}
                          </Button>
                        ) : (
                          <Link href={`/sessions/${session._id}/live`}>
                            <Button variant="outline" className="text-violet-600 border-violet-200 hover:bg-violet-50 font-medium h-8 px-3 gap-1.5 text-xs">
                              <Eye className="h-3.5 w-3.5" />
                              {t.sessions.view}
                            </Button>
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between py-4 text-sm text-gray-500">
          <div>{t.sessions.showing.replace("{count}", String(filteredSessions.length))}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 border-gray-200" disabled>
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 bg-violet-600 text-white hover:bg-violet-700 hover:text-white border-violet-600 font-bold">
              1
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 border-gray-200" disabled>
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
