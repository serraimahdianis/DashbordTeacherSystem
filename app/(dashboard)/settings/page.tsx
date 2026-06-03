"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/locale-context";
import { axiosInstance, teachersApi, useApi } from "@/lib/api";
import type { Group, Speciality, Year } from "@/types/api";

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [department, setDepartment] = useState(user?.department ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [selectedGroups, setSelectedGroups] = useState<string[]>(user?.groups || []);
  const [selectedYears, setSelectedYears] = useState<string[]>(user?.years || []);
  const [selectedSpecialities, setSelectedSpecialities] = useState<string[]>(user?.specialities || []);

  const { data: groupsData } = useApi<{ data: Group[] }>("/metadata/groups");
  const { data: yearsData } = useApi<{ data: Year[] }>("/metadata/years");
  const { data: specData } = useApi<{ data: Speciality[] }>("/metadata/specialities");

  const allGroups = groupsData?.data || [];
  const allYears = yearsData?.data || [];
  const allSpecialities = specData?.data || [];
  
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line
      setFullName(user.fullName ?? "");
      setDepartment(user.department ?? "");
      setSelectedGroups(user.groups || []);
      setSelectedYears(user.years || []);
      setSelectedSpecialities(user.specialities || []);
    }
  }, [user]);

  const handleToggle = (type: "groups" | "years" | "specialities", val: string) => {
    if (type === "groups") {
      setSelectedGroups((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
    } else if (type === "years") {
      setSelectedYears((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
    } else if (type === "specialities") {
      setSelectedSpecialities((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    setError(null);
    try {
      await teachersApi.update(user.id, { 
        fullName, 
        department,
        groups: selectedGroups,
        years: selectedYears,
        specialities: selectedSpecialities
      });
      updateUser({
        fullName,
        department,
        groups: selectedGroups,
        years: selectedYears,
        specialities: selectedSpecialities
      });
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

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.profileInfo}</CardTitle>
          <CardDescription>{t.settings.profileDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-2xl">
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
          
          <div className="space-y-2 pt-4 border-t border-gray-100">
            <Label>My Assigned Years</Label>
            <div className="flex flex-wrap gap-2">
              {allYears.map(y => (
                <label key={y._id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full cursor-pointer hover:bg-gray-100 transition-colors">
                  <input type="checkbox" checked={selectedYears.includes(y.name)} onChange={() => handleToggle("years", y.name)} className="accent-violet-600" />
                  <span className="text-sm text-gray-700">{y.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>My Assigned Groups</Label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
              {allGroups.map(g => (
                <label key={g._id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full cursor-pointer hover:bg-gray-100 transition-colors">
                  <input type="checkbox" checked={selectedGroups.includes(g.name)} onChange={() => handleToggle("groups", g.name)} className="accent-violet-600" />
                  <span className="text-sm text-gray-700">{g.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>My Assigned Specialities</Label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
              {allSpecialities.map(s => (
                <label key={s._id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full cursor-pointer hover:bg-gray-100 transition-colors">
                  <input type="checkbox" checked={selectedSpecialities.includes(s.name)} onChange={() => handleToggle("specialities", s.name)} className="accent-violet-600" />
                  <span className="text-sm text-gray-700">{s.name}</span>
                </label>
              ))}
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

      <Card>
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

            <div className="bg-gray-50/50 rounded-2xl p-4 space-y-2 mt-4">
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
              onClick={async () => {
                if (!user?.id) return;
                setError(null);
                setSaved(false);
                try {
                  await axiosInstance.patch("/auth/teacher/change-password", {
                    currentPassword,
                    newPassword,
                  });
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setSaved(true);
                  setTimeout(() => setSaved(false), 2000);
                } catch (err: unknown) {
                  const axiosErr = err as { response?: { data?: { message?: string } } };
                  setError(axiosErr.response?.data?.message || t.common.error);
                }
              }}
            >
              {t.settings.updatePassword}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
