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
import { studentsApi, useApi } from "@/lib/api";
import type { Student, Teacher, PaginatedResponse } from "@/types/api";

const createSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  birthday: z.string().regex(/^\d{8}$/, "Birthday must be 8 digits (DDMMYYYY)"),
  studentId: z.string().regex(/^\d+$/, "Student ID must contain only digits"),
  rfidCode: z.string().min(1, "RFID code is required"),
  qrCode: z.string().min(1, "QR code is required"),
  group: z.string().min(1, "Group is required"),
  year: z.string().min(1, "Year is required"),
  speciality: z.string().min(1, "Speciality is required"),
  teacherId: z.string().optional(),
});

const editSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  studentId: z.string().regex(/^\d+$/, "Student ID must contain only digits"),
  rfidCode: z.string().min(1, "RFID code is required"),
  qrCode: z.string().min(1, "QR code is required"),
  group: z.string().min(1, "Group is required"),
  year: z.string().min(1, "Year is required"),
  speciality: z.string().min(1, "Speciality is required"),
  teacherId: z.string().optional(),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;

interface StudentFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
  onSuccess: () => void;
}

export function StudentFormSheet({ open, onOpenChange, student, onSuccess }: StudentFormSheetProps) {
  const isEdit = !!student;

  const { data: teachersData } = useApi<PaginatedResponse<Teacher>>("/teachers?page=1&limit=100");
  const teachersList = teachersData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormData>({
    resolver: zodResolver(isEdit ? editSchema : createSchema) as any,
  });

  const rfidCodeValue = watch("rfidCode");

  // Auto-generate QR code based on RFID code
  useEffect(() => {
    if (rfidCodeValue) {
      const generatedQr = rfidCodeValue.startsWith("RFID-")
        ? rfidCodeValue.replace(/^RFID-/i, "QR-")
        : `QR-${rfidCodeValue}`;
      setValue("qrCode", generatedQr, { shouldValidate: true });
    }
  }, [rfidCodeValue, setValue]);

  useEffect(() => {
    if (open) {
      if (student) {
        reset({
          fullName: student.fullName,
          email: student.email,
          birthday: "",
          studentId: student.studentId,
          rfidCode: student.rfidCode,
          qrCode: student.qrCode,
          group: student.group,
          year: student.year,
          speciality: student.speciality,
          teacherId: student.teacherId ?? "",
        });
      } else {
        reset({ fullName: "", email: "", birthday: "", studentId: "", rfidCode: "", qrCode: "", group: "", year: "", speciality: "", teacherId: "" });
      }
    }
  }, [open, student, reset]);

  const onSubmit = async (data: CreateFormData) => {
    try {
      if (isEdit && student) {
        const { birthday, ...updateData } = data;
        void birthday; // Not sent on update
        await studentsApi.update(student._id, updateData);
      } else {
        await studentsApi.create(data);
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg || "An error occurred. Please try again.");
    }
  };

  const yearOptions = ["L1", "L2", "L3", "M1", "M2"];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Student" : "Add New Student"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "Update the student's information below." : "Fill in all details to register a new student."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" placeholder="Amine Khelifi" {...register("fullName")} className={errors.fullName ? "border-red-300" : ""} />
              {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="student@student.dz" {...register("email")} className={errors.email ? "border-red-300" : ""} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {!isEdit && (
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="birthday">Birthday (DDMMYYYY)</Label>
                <Input id="birthday" placeholder="26062003" maxLength={8} {...register("birthday")} className={errors.birthday ? "border-red-300" : ""} />
                <p className="text-[10px] text-gray-400">This becomes the student&apos;s password</p>
                {errors.birthday && <p className="text-xs text-red-500">{errors.birthday.message}</p>}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="studentId">Student ID</Label>
              <Input id="studentId" placeholder="1001" {...register("studentId")} className={errors.studentId ? "border-red-300" : ""} />
              {errors.studentId && <p className="text-xs text-red-500">{errors.studentId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="year">Year</Label>
              <select
                id="year"
                {...register("year")}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Select year</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              {errors.year && <p className="text-xs text-red-500">{errors.year.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="group">Group</Label>
              <Input id="group" placeholder="2A" {...register("group")} className={errors.group ? "border-red-300" : ""} />
              {errors.group && <p className="text-xs text-red-500">{errors.group.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="speciality">Speciality</Label>
              <Input id="speciality" placeholder="Computer Science" {...register("speciality")} className={errors.speciality ? "border-red-300" : ""} />
              {errors.speciality && <p className="text-xs text-red-500">{errors.speciality.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rfidCode">RFID Code</Label>
              <Input id="rfidCode" placeholder="RFID-0001-ABCD" {...register("rfidCode")} className={errors.rfidCode ? "border-red-300" : ""} />
              {errors.rfidCode && <p className="text-xs text-red-500">{errors.rfidCode.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qrCode">QR Code</Label>
              <Input id="qrCode" placeholder="QR-0001-EFGH" {...register("qrCode")} className={errors.qrCode ? "border-red-300" : ""} />
              {errors.qrCode && <p className="text-xs text-red-500">{errors.qrCode.message}</p>}
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="teacherId">Assigned Teacher (Optional)</Label>
              <select
                id="teacherId"
                {...register("teacherId")}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">No specific teacher (uses schedules)</option>
                {teachersList.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.fullName} ({t.department})
                  </option>
                ))}
              </select>
              {errors.teacherId && <p className="text-xs text-red-500">{errors.teacherId.message}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Save Changes" : "Create Student"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
