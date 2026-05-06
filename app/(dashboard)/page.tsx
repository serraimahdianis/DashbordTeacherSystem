import { redirect } from "next/navigation";

// The dashboard home has moved to /dashboard
// This ensures old bookmarks still work
export default function DashboardRootRedirect() {
  redirect("/dashboard");
}
