"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { teachersApi, useApi } from "@/lib/api";
import type { Teacher, Group, Speciality, Year } from "@/types/api";

const createSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  department: z.string().min(2, "Department is required"),
  groups: z.array(z.string()).optional(),
  years: z.array(z.string()).optional(),
  specialities: z.array(z.string()).optional(),
});

const editSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  department: z.string().min(2, "Department is required"),
  groups: z.array(z.string()).optional(),
  years: z.array(z.string()).optional(),
  specialities: z.array(z.string()).optional(),
});

type CreateFormData = z.infer<typeof createSchema>;

interface TeacherFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher?: Teacher | null;
  onSuccess: () => void;
}

export function TeacherFormSheet({ open, onOpenChange, teacher, onSuccess }: TeacherFormSheetProps) {
  const isEdit = !!teacher;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(isEdit ? editSchema : createSchema) as any,
  });

  const { data: allGroups } = useApi<Group[]>("/metadata/groups");
  const { data: allYears } = useApi<Year[]>("/metadata/years");
  const { data: allSpecialities } = useApi<Speciality[]>("/metadata/specialities");

  const selectedGroups = watch("groups") || [];
  const selectedYears = watch("years") || [];
  const selectedSpecialities = watch("specialities") || [];

  const handleToggle = (field: "groups" | "years" | "specialities", val: string) => {
    const current = watch(field) || [];
    if (current.includes(val)) {
      setValue(field, current.filter(item => item !== val), { shouldValidate: true });
    } else {
      setValue(field, [...current, val], { shouldValidate: true });
    }
  };

  useEffect(() => {
    if (open) {
      if (teacher) {
        reset({
          fullName: teacher.fullName,
          email: teacher.email,
          department: teacher.department,
          password: "",
          groups: teacher.groups || [],
          years: teacher.years || [],
          specialities: teacher.specialities || [],
        });
      } else {
        reset({ fullName: "", email: "", password: "", department: "", groups: [], years: [], specialities: [] });
      }
    }
  }, [open, teacher, reset]);

  const onSubmit = async (data: CreateFormData) => {
    try {
      if (isEdit && teacher) {
        await teachersApi.update(teacher._id, {
          fullName: data.fullName,
          email: data.email,
          department: data.department,
          groups: data.groups,
          years: data.years,
          specialities: data.specialities,
        });
      } else {
        await teachersApi.create({
          ...data,
          groups: data.groups || [],
          years: data.years || [],
          specialities: data.specialities || [],
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg || "An error occurred. Please try again.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Teacher" : "Add New Teacher"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "Update the teacher's information below." : "Fill in the details to register a new teacher."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" placeholder="Dr. Ahmed Bouzid" {...register("fullName")} className={errors.fullName ? "border-red-300" : ""} />
            {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="teacher@univ-setif.dz" {...register("email")} className={errors.email ? "border-red-300" : ""} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Minimum 6 characters" {...register("password")} className={errors.password ? "border-red-300" : ""} />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input id="department" placeholder="Computer Science" {...register("department")} className={errors.department ? "border-red-300" : ""} />
            {errors.department && <p className="text-xs text-red-500">{errors.department.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Assigned Years</Label>
            <div className="flex flex-wrap gap-2">
              {allYears?.map(y => (
                <label key={y._id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full cursor-pointer hover:bg-gray-100 transition-colors">
                  <input type="checkbox" checked={selectedYears.includes(y.name)} onChange={() => handleToggle("years", y.name)} className="accent-indigo-600" />
                  <span className="text-sm text-gray-700">{y.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assigned Groups</Label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
              {allGroups?.map(g => (
                <label key={g._id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full cursor-pointer hover:bg-gray-100 transition-colors">
                  <input type="checkbox" checked={selectedGroups.includes(g.name)} onChange={() => handleToggle("groups", g.name)} className="accent-indigo-600" />
                  <span className="text-sm text-gray-700">{g.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assigned Specialities</Label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
              {allSpecialities?.map(s => (
                <label key={s._id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full cursor-pointer hover:bg-gray-100 transition-colors">
                  <input type="checkbox" checked={selectedSpecialities.includes(s.name)} onChange={() => handleToggle("specialities", s.name)} className="accent-indigo-600" />
                  <span className="text-sm text-gray-700">{s.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Save Changes" : "Create Teacher"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
