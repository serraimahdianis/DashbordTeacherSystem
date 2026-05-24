"use client";

import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";

export function Header() {
  const currentDate = format(new Date(), "EEEE, MMMM do, yyyy");
  const { user } = useAuth();

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b-0 bg-white/80 backdrop-blur-md px-4 md:px-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-800">Smart Attendance</h2>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div className="text-sm font-medium text-gray-500 hidden md:block">
          {currentDate}
        </div>

        <div className="flex items-center gap-3 pl-4 md:pl-6">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-violet-100 text-violet-700 font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col">
            <span className="text-sm font-medium text-gray-900">{user?.fullName ?? "Teacher"}</span>
            <span className="text-xs text-gray-500">{user?.department ?? ""}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
