"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/locale-context";
import { teachersApi } from "@/lib/api";

export default function SettingsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [department, setDepartment] = useState(user?.department ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    setError(null);
    try {
      await teachersApi.update(user.id, { fullName, department });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || t.common.error);
    } finally {
      setIsSaving(false);
    }
  };

  const passwordMeetsLength = newPassword.length >= 8;
  const passwordHasUppercase = /[A-Z]/.test(newPassword);
  const passwordHasNumber = /[0-9]/.test(newPassword);

  return (
    <div className="flex flex-col space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t.settings.title}</h1>
        <p className="text-gray-500 mt-1">{t.settings.subtitle}</p>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle>{t.settings.profileInfo}</CardTitle>
          <CardDescription>{t.settings.profileDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t.settings.fullName}</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.settings.email}</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500">{t.settings.emailNote}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">{t.settings.department}</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
          </div>
          <Button
            className="mt-4 bg-violet-600 hover:bg-violet-700 text-white"
            onClick={handleSaveProfile}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : saved ? t.settings.saved : t.common.save}
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle>{t.settings.changePassword}</CardTitle>
          <CardDescription>{t.settings.passwordDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t.settings.currentPassword}</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t.settings.newPassword}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t.settings.confirmPassword}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2 mt-4">
              <p className="text-sm font-medium text-gray-900">{t.settings.requirements}:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {[
                  { label: t.settings.minChars, ok: passwordMeetsLength },
                  { label: t.settings.uppercase, ok: passwordHasUppercase },
                  { label: t.settings.number, ok: passwordHasNumber },
                ].map(({ label, ok }) => (
                  <li key={label} className="flex items-center gap-2">
                    <CheckCircle className={`h-4 w-4 ${ok ? "text-emerald-500" : "text-gray-300"}`} />
                    {label}
                  </li>
                ))}
              </ul>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-red-500 mt-2">{t.settings.noMatch}</p>
              )}
            </div>

            <Button
              className="mt-4"
              variant="outline"
              disabled={
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword ||
                !passwordMeetsLength ||
                !passwordHasUppercase ||
                !passwordHasNumber
              }
            >
              {t.settings.updatePassword}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
