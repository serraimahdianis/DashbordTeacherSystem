"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import {
  Home,
  CalendarDays,
  PlayCircle,
  Users,
  FileText,
  Settings,
  GraduationCap,
  LogOut,
  Menu,
  X,
  Globe,
} from "lucide-react";

const navKeys = [
  { key: "dashboard" as const, href: "/dashboard", icon: Home },
  { key: "schedule" as const, href: "/schedule", icon: CalendarDays },
  { key: "sessions" as const, href: "/sessions", icon: PlayCircle },
  { key: "students" as const, href: "/students", icon: Users },
  { key: "reports" as const, href: "/reports", icon: FileText },
  { key: "settings" as const, href: "/settings", icon: Settings },
];

const LANG_LABELS: Record<string, string> = { en: "EN", fr: "FR", ar: "AR" };

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const { user, logout } = useAuth();
  const { t, locale, setLocale } = useLocale();

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const sidebarContent = (
    <>
      <div className="flex h-20 items-center px-6">
        <div className="flex items-center gap-3 font-bold text-gray-900 text-lg">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600 text-white">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="flex flex-col leading-tight">
            <span>Smart</span>
            <span>Attendance</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4">
        {navKeys.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                isActive
                  ? "bg-violet-50 text-violet-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-violet-600" : "text-gray-400 group-hover:text-gray-600"
                )}
              />
              {t.nav[item.key]}
            </Link>
          );
        })}
      </nav>

      {/* Language switcher */}
      <div className="px-4 pb-2 relative">
        <button
          onClick={() => setShowLangMenu((v) => !v)}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <Globe className="h-5 w-5 text-gray-400" />
          {t.settings.language}
          <span className="ml-auto text-xs font-bold text-violet-600">{LANG_LABELS[locale]}</span>
        </button>
        {showLangMenu && (
          <div className="absolute bottom-full left-4 right-4 mb-1 bg-white rounded-[2rem] border-0 shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden z-50">
            {(["en", "fr", "ar"] as const).map((lng) => (
              <button
                key={lng}
                onClick={() => { setLocale(lng); setShowLangMenu(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left",
                  locale === lng ? "bg-violet-50 text-violet-700" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <span className="text-xs font-bold w-6">{LANG_LABELS[lng]}</span>
                {lng === "en" ? "English" : lng === "fr" ? "Français" : "العربية"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User profile + logout */}
      <div className="p-4 mb-2">
        <div className="flex items-center justify-between rounded-2xl border-0 shadow-[0_2px_10px_rgb(0,0,0,0.04)] p-3 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-9 w-9 border border-gray-200 shrink-0">
              <AvatarFallback className="bg-violet-100 text-violet-700 font-bold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-gray-900 truncate">{user?.fullName ?? "Teacher"}</span>
              <span className="text-xs text-gray-500 truncate">{user?.department ?? ""}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="ml-2 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
            title={t.common.logout}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden flex items-center justify-center h-10 w-10 rounded-lg bg-white border border-gray-200 shadow-sm"
      >
        {mobileOpen ? <X className="h-5 w-5 text-gray-700" /> : <Menu className="h-5 w-5 text-gray-700" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col border-r-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] bg-white transition-transform md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-[260px] flex-col border-r-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] bg-white">
        {sidebarContent}
      </aside>
    </>
  );
}
