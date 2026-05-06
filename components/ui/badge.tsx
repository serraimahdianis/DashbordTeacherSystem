import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "present" | "late" | "absent"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
        {
          "border-transparent bg-violet-600 text-white hover:bg-violet-700": variant === "default",
          "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200": variant === "secondary",
          "border-transparent bg-red-500 text-white hover:bg-red-600": variant === "destructive",
          "text-gray-950": variant === "outline",
"border-transparent bg-emerald-50 text-emerald-600 hover:bg-emerald-100": variant === "success" || variant === "present",
"border-transparent bg-amber-50 text-amber-600 hover:bg-amber-100": variant === "warning" || variant === "late",
"border-transparent bg-red-50 text-red-600 hover:bg-red-100": variant === "absent",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }