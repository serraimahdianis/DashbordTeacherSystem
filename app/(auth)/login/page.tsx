"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/locale-context";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
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
            {t.landing.heroTitle}
          </h1>
          <p className="text-violet-200 text-lg leading-relaxed">
            {t.landing.heroSubtitle}
          </p>
          <div className="flex flex-col gap-3 pt-4">
            {[t.landing.feature1Title, t.landing.feature2Title, t.landing.feature3Title].map((item) => (
              <div key={item} className="flex items-center gap-3 text-violet-100">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-violet-300">{t.landing.footer}</p>
      </div>

      {/* Right panel — Login form */}
      <div className="flex flex-col w-full lg:w-1/2 items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="h-12 w-12 bg-violet-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">{t.auth.login}</h2>
            <p className="mt-2 text-sm text-gray-500">
              {t.dashboard.subtitle}
            </p>
          </div>

          <form
            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 space-y-5"
            onSubmit={handleSubmit(onSubmit)}
          >
            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {serverError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t.auth.email}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="j.doe@univ-xyz.dz"
                {...register("email")}
                className={errors.email ? "border-red-300 focus-visible:ring-red-400" : ""}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t.auth.password}</Label>
                <a href="#" className="text-xs font-medium text-violet-600 hover:text-violet-500">
                  {t.auth.forgotPassword}
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("password")}
                  className={errors.password ? "border-red-300 focus-visible:ring-red-400 pr-10" : "pr-10"}
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
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11 text-base font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? t.auth.signingIn : t.auth.login}
            </Button>

            <p className="text-center text-sm text-gray-600">
              {t.auth.noAccount}{" "}
              <Link href="/register" className="font-semibold text-violet-600 hover:text-violet-500">
                {t.auth.registerHere}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
