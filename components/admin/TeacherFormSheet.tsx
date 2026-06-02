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
import { teachersApi } from "@/lib/api";
import type { Teacher } from "@/types/api";

const createSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  department: z.string().min(2, "Department is required"),
});

const editSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  department: z.string().min(2, "Department is required"),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;

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
    formState: { errors, isSubmitting },
  } = useForm<CreateFormData>({
    resolver: zodResolver(isEdit ? editSchema : createSchema) as any,
  });

  useEffect(() => {
    if (open) {
      if (teacher) {
        reset({ fullName: teacher.fullName, email: teacher.email, department: teacher.department, password: "" });
      } else {
        reset({ fullName: "", email: "", password: "", department: "" });
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
        });
      } else {
        await teachersApi.create(data);
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
