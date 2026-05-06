"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/locale-context";

const registerSchema = z.object({
  fullName: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  department: z.string().min(2, "Department is required"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

type RegisterData = z.infer<typeof registerSchema>;
type OtpData = z.infer<typeof otpSchema>;

export default function RegisterPage() {
  const { register: registerUser, verifyOtp } = useAuth();
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [pendingEmail, setPendingEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  const otpForm = useForm<OtpData>({
    resolver: zodResolver(otpSchema),
  });

  const onRegister = async (data: RegisterData) => {
    setServerError(null);
    try {
      await registerUser(data);
      setPendingEmail(data.email);
      setSuccessMsg(t.auth.otpSent);
      setStep(2);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        t.common.error;
      setServerError(typeof msg === "string" ? msg : t.common.error);
    }
  };

  const onVerifyOtp = async (data: OtpData) => {
    setServerError(null);
    try {
      await verifyOtp(pendingEmail, data.otp);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        t.common.error;
      setServerError(typeof msg === "string" ? msg : t.common.error);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-1/2 bg-gradient-to-br from-violet-600 to-violet-900 p-12 text-white justify-between">
        <div className="flex items-center gap-3 font-bold text-xl">
          <div className="h-9 w-9 bg-white/20 rounded-lg flex items-center justify-center">
            <GraduationCap className="h-5 w-5" />
          </div>
          SmartAttendance
        </div>
        <div className="space-y-6 max-w-lg">
          <h1 className="text-4xl font-bold leading-tight">
            {t.auth.register}
          </h1>
          <p className="text-violet-200 text-lg leading-relaxed">
            {t.landing.heroSubtitle}
          </p>
          {/* Step indicator */}
          <div className="flex items-center gap-4 pt-4">
            <div className={`flex items-center gap-2 text-sm font-medium ${step >= 1 ? "text-white" : "text-violet-400"}`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? "bg-white text-violet-700" : "bg-violet-500/40 text-white"}`}>
                {step > 1 ? <CheckCircle2 className="h-4 w-4" /> : "1"}
              </div>
              {t.auth.register}
            </div>
            <div className="h-px flex-1 bg-violet-400" />
            <div className={`flex items-center gap-2 text-sm font-medium ${step === 2 ? "text-white" : "text-violet-400"}`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? "bg-white text-violet-700" : "bg-violet-500/40 text-white"}`}>
                2
              </div>
              {t.auth.verify}
            </div>
          </div>
        </div>
        <p className="text-sm text-violet-300">{t.landing.footer}</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-col w-full lg:w-1/2 items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="h-12 w-12 bg-violet-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              {step === 1 ? t.auth.register : t.auth.verify}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {step === 1
                ? t.landing.heroSubtitle
                : `${t.auth.otpSent} — ${pendingEmail}`}
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
                {serverError}
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3 mb-5 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {successMsg}
              </div>
            )}

            {step === 1 ? (
              <form className="space-y-4" onSubmit={registerForm.handleSubmit(onRegister)}>
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t.auth.fullName}</Label>
                  <Input
                    id="fullName"
                    placeholder="Dr. Ahmed Bouzid"
                    {...registerForm.register("fullName")}
                    className={registerForm.formState.errors.fullName ? "border-red-300" : ""}
                  />
                  {registerForm.formState.errors.fullName && (
                    <p className="text-xs text-red-500">{registerForm.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email">{t.auth.email}</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="a.bouzid@univ-setif.dz"
                    {...registerForm.register("email")}
                    className={registerForm.formState.errors.email ? "border-red-300" : ""}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-xs text-red-500">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">{t.auth.department}</Label>
                  <Input
                    id="department"
                    placeholder="Computer Science"
                    {...registerForm.register("department")}
                    className={registerForm.formState.errors.department ? "border-red-300" : ""}
                  />
                  {registerForm.formState.errors.department && (
                    <p className="text-xs text-red-500">{registerForm.formState.errors.department.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password">{t.auth.password}</Label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 6 characters"
                      {...registerForm.register("password")}
                      className={registerForm.formState.errors.password ? "border-red-300 pr-10" : "pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-xs text-red-500">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11 text-base font-semibold mt-2"
                  disabled={registerForm.formState.isSubmitting}
                >
                  {registerForm.formState.isSubmitting ? t.auth.registering : t.auth.register}
                </Button>

                <p className="text-center text-sm text-gray-600">
                  {t.auth.hasAccount}{" "}
                  <Link href="/login" className="font-semibold text-violet-600 hover:text-violet-500">
                    {t.auth.loginHere}
                  </Link>
                </p>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={otpForm.handleSubmit(onVerifyOtp)}>
                <div className="space-y-2">
                  <Label htmlFor="otp">{t.auth.otpCode}</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest font-mono h-14"
                    {...otpForm.register("otp")}
                  />
                  {otpForm.formState.errors.otp && (
                    <p className="text-xs text-red-500 text-center">{otpForm.formState.errors.otp.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11 text-base font-semibold"
                  disabled={otpForm.formState.isSubmitting}
                >
                  {otpForm.formState.isSubmitting ? t.auth.verifying : t.auth.verify}
                </Button>

                <button
                  type="button"
                  onClick={() => { setStep(1); setServerError(null); setSuccessMsg(null); }}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
                >
                  ← {t.auth.register}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
