"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useApi, modulesApi, schedulesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/locale-context";
import type { Schedule, Module, Group, Speciality, Year } from "@/types/api";
import { useSWRConfig } from "swr";

interface ScheduleFormData {
  moduleId: string;
  type: string;
  year: string;
  group: string;
  speciality: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
}

export default function SchedulePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { mutate } = useSWRConfig();
  const swrKey = user?.role === "admin" ? "/schedules" : user?.id ? `/schedules/teacher/${user.id}` : null;

  const { data: schedulesData, isLoading } = useApi<{ data: Schedule[] }>(swrKey);
  const { data: modulesData } = useApi<{ data: Module[] }>(user?.role === "admin" ? "/modules" : user?.id ? `/modules/teacher/${user.id}` : null);
  const { data: groups } = useApi<Group[]>("/metadata/groups");
  const { data: specialities } = useApi<Speciality[]>("/metadata/specialities");
  const { data: years } = useApi<Year[]>("/metadata/years");

  const schedules = schedulesData?.data;
  const modules = modulesData?.data;

  const [typeFilter, setTypeFilter] = useState(t.schedule.allTypes);
  const [yearFilter, setYearFilter] = useState(t.schedule.allYears);
  const [dayFilter, setDayFilter] = useState(t.schedule.allDays);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState<ScheduleFormData>({
    moduleId: "",
    type: "",
    year: "",
    group: "",
    speciality: "",
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    room: "",
  });

  const allSchedules = schedules ?? [];
  const allModules = modules ?? [];

  const filteredSchedules = allSchedules.filter((s) => {
    const type = typeof s.type === "string" ? s.type : "";
    if (typeFilter !== t.schedule.allTypes && type.toLowerCase() !== typeFilter.toLowerCase()) return false;
    if (yearFilter !== t.schedule.allYears && s.year !== yearFilter) return false;
    if (dayFilter !== t.schedule.allDays && s.dayOfWeek !== dayFilter) return false;
    return true;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setFormError(null);
    setSaving(true);
    try {
      await schedulesApi.create({
        teacherId: user.id,
        moduleId: form.moduleId,
        type: form.type as "cours" | "td" | "tp",
        year: form.year as any,
        group: form.group || null,
        speciality: form.speciality || null,
        dayOfWeek: form.dayOfWeek as any,
        startTime: form.startTime,
        endTime: form.endTime,
        room: form.room,
      });
      await mutate(swrKey);
      setSheetOpen(false);
      setForm({ moduleId: "", type: "", year: "", group: "", speciality: "", dayOfWeek: "", startTime: "", endTime: "", room: "" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(typeof msg === "string" ? msg : "Failed to save schedule.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm(t.schedule.deleteConfirm || "Are you sure you want to delete this schedule?")) return;
    setDeletingId(scheduleId);
    try {
      await schedulesApi.delete(scheduleId);
      await mutate(swrKey);
    } catch (err) {
      console.error("Failed to delete schedule:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const getModuleName = (moduleId: string | Module | undefined) => {
    if (!moduleId) return "—";
    if (typeof moduleId === "string") {
      const mod = allModules.find((m) => m._id === moduleId);
      return mod?.name ?? moduleId;
    }
    return moduleId.name;
  };

  const getTypeBadge = (type: string) => {
    const upper = type.toUpperCase();
    const cls =
      upper === "TP"
        ? "bg-blue-50 text-blue-600 border-transparent font-bold"
        : upper === "TD"
        ? "bg-emerald-50 text-emerald-600 border-transparent font-bold"
        : "bg-violet-50 text-violet-600 border-transparent font-bold";
    return <Badge variant="outline" className={cls}>{upper}</Badge>;
  };

  return (
    <div className="flex flex-col space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t.schedule.title}</h1>
          <p className="text-gray-500 mt-1">{t.schedule.subtitle}</p>
        </div>

        <div className="flex gap-3">

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm font-medium h-10 px-4 gap-2">
                <Plus className="h-4 w-4" />
                {t.schedule.addSchedule}
              </Button>
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader className="text-left mb-6">
                <SheetTitle className="text-xl font-bold">{t.schedule.addSchedule}</SheetTitle>
                <SheetDescription className="text-gray-500">
                  {t.schedule.autoGeneratedDesc}
                </SheetDescription>
              </SheetHeader>

              <form className="space-y-5" onSubmit={handleSave}>
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {formError}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">{t.schedule.moduleName} <span className="text-red-500">*</span></Label>
                <select
                  required
                  className="w-full h-11 rounded-2xl border-0 bg-gray-50/50 px-4 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  value={form.moduleId}
                  onChange={(e) => setForm((p) => ({ ...p, moduleId: e.target.value }))}
                >
                  <option value="">{t.schedule.moduleName}</option>
                  {allModules.map((m) => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">{t.sessions.type} <span className="text-red-500">*</span></Label>
                <select
                  required
                  className="w-full h-11 rounded-2xl border-0 bg-gray-50/50 px-4 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-violet-500 transition-all"
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
                <Label className="text-sm font-semibold text-gray-700">{t.schedule.year} <span className="text-red-500">*</span></Label>
                <select
                  required
                  className="w-full h-11 rounded-2xl border-0 bg-gray-50/50 px-4 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  value={form.year}
                  onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))}
                >
                  <option value="">{t.schedule.year}</option>
                  {years?.map((y) => (
                    <option key={y._id} value={y.name}>{y.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">{t.schedule.groupField} {form.type !== "cours" && <span className="text-red-500">*</span>}</Label>
                <select
                  required={form.type !== "cours"}
                  className="w-full h-11 rounded-2xl border-0 bg-gray-50/50 px-4 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  value={form.group}
                  onChange={(e) => setForm((p) => ({ ...p, group: e.target.value }))}
                >
                  <option value="">{form.type === "cours" ? "All Groups (Whole Year)" : "Select group"}</option>
                  {groups?.map((g) => (
                    <option key={g._id} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Speciality <span className="text-gray-400 text-xs font-normal">(optional — leave blank for all)</span></Label>
                <select
                  className="w-full h-11 rounded-2xl border-0 bg-gray-50/50 px-4 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  value={form.speciality}
                  onChange={(e) => setForm((p) => ({ ...p, speciality: e.target.value }))}
                >
                  <option value="">All Specialities</option>
                  {specialities?.map((s) => (
                    <option key={s._id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">{t.schedule.day} <span className="text-red-500">*</span></Label>
                <select
                  required
                  className="w-full h-11 rounded-2xl border-0 bg-gray-50/50 px-4 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  value={form.dayOfWeek}
                  onChange={(e) => setForm((p) => ({ ...p, dayOfWeek: e.target.value }))}
                >
                  <option value="">{t.schedule.day}</option>
                  {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => (
                    <option key={d} value={d}>
                      {t.schedule.days?.[d as keyof typeof t.schedule.days] || d}
                    </option>
                  ))}
                </select>
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
                <Label className="text-sm font-semibold text-gray-700">{t.schedule.roomField} <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. Room A101"
                  required
                  className="h-10 border-gray-200"
                  value={form.room}
                  onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))}
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
                    t.schedule.saveSchedule
                  )}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-md border-0 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col">
        <div className="p-4 bg-gray-50/30 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3">
            {[
              { value: typeFilter, onChange: setTypeFilter, opts: [t.schedule.allTypes, "cours", "td", "tp"] },
              { value: yearFilter, onChange: setYearFilter, opts: [t.schedule.allYears, ...(years?.map(y => y.name) || [])] },
              { value: dayFilter, onChange: setDayFilter, opts: [t.schedule.allDays, "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"] },
            ].map((sel, i) => (
              <select
                key={i}
                className="h-9 rounded-full border-0 bg-gray-50/50 px-3 text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-violet-500 min-w-[120px]"
                value={sel.value}
                onChange={(e) => sel.onChange(e.target.value)}
              >
                {sel.opts.map((o) => <option key={o}>{o}</option>)}
              </select>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600">
            <CalendarDays className="h-4 w-4" />
            {format(new Date(), "MMMM yyyy")}
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-bold text-gray-900 py-4">{t.sessions.module}</TableHead>
                  <TableHead className="font-bold text-gray-900">{t.sessions.type}</TableHead>
                  <TableHead className="font-bold text-gray-900">{t.schedule.year}</TableHead>
                  <TableHead className="font-bold text-gray-900">{t.sessions.group}</TableHead>
                  <TableHead className="font-bold text-gray-900">Speciality</TableHead>
                  <TableHead className="font-bold text-gray-900">{t.schedule.day}</TableHead>
                  <TableHead className="font-bold text-gray-900">{t.sessions.time}</TableHead>
                  <TableHead className="font-bold text-gray-900">{t.sessions.room}</TableHead>
                  <TableHead className="font-bold text-gray-900 text-right">{t.sessions.action}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchedules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                      {t.common.noData}
                    </TableCell>
                  </TableRow>
                )}
                {filteredSchedules.map((schedule) => (
                  <TableRow key={schedule._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <TableCell className="font-semibold text-gray-900 py-4">
                      {getModuleName(schedule.moduleId)}
                    </TableCell>
                    <TableCell>{getTypeBadge(schedule.type)}</TableCell>
                    <TableCell className="text-gray-600">{schedule.year}</TableCell>
                    <TableCell className="text-gray-600">
                      {schedule.group ? `${t.sessions.group} ${schedule.group}` : "—"}
                    </TableCell>
                    <TableCell>
                      {schedule.speciality ? (
                        <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-100 font-medium text-xs">
                          {schedule.speciality}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-xs">All</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {t.schedule.days?.[schedule.dayOfWeek as keyof typeof t.schedule.days] || schedule.dayOfWeek}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {schedule.startTime} - {schedule.endTime}
                    </TableCell>
                    <TableCell className="text-gray-600">{schedule.room}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleDelete(schedule._id)}
                        disabled={deletingId === schedule._id}
                      >
                        {deletingId === schedule._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-100 text-sm text-gray-500">
          <div>{t.schedule.showing.replace("{count}", String(filteredSchedules.length)).replace("{total}", String(allSchedules.length))}</div>
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

      {/* Info box */}
      <div className="bg-gray-50/50 border-0 shadow-[0_2px_10px_rgb(0,0,0,0.02)] rounded-[2rem] p-4 flex gap-4 items-start max-w-2xl">
        <div className="h-10 w-10 shrink-0 bg-white border-0 rounded-2xl flex items-center justify-center text-violet-600 shadow-sm">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-sm">{t.schedule.autoGenerated}</h4>
          <p className="text-sm text-gray-500 mt-1">{t.schedule.autoGeneratedDesc}</p>
        </div>
      </div>
    </div>
  );
}
