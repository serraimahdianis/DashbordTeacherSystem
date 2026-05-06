# Teacher Kit

**Smart Attendance Teacher Kit** — a university attendance management system for teachers. Manages weekly teaching schedules, live RFID/QR scanning sessions, student attendance tracking, reports, and at-risk alerts. Connects to an external NestJS backend API; uses mock data by default.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.4 (App Router) |
| UI | React 19.2.4 + TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 (CSS-based config) |
| Data Fetching | SWR (`useApi<T>`, `usePolling<T>`) |
| Forms | react-hook-form + zod + @hookform/resolvers |
| Charts | recharts |
| Icons | lucide-react |
| Dates | date-fns |
| Auth | Custom React Context (no NextAuth/Clerk) |
| Backend | External NestJS API (not in this repo) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Environment Variables

Create a `.env.local` file (see `.env.local` for reference):

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000/api` | NestJS backend URL |
| `NEXT_PUBLIC_USE_MOCK_DATA` | `"true"` | Set to `"false"` to use real API |

## Available Scripts

```bash
npm run dev        # Dev server on http://localhost:3001
npm run build      # Production build
npm run start      # Start production server on http://localhost:3001
npm run lint       # Run ESLint
npx tsc --noEmit   # TypeScript type check
```

## Project Structure

```
app/
  layout.tsx              # Root layout (Inter font, metadata)
  globals.css             # Tailwind v4 + @theme + CSS custom properties
  (auth)/
    login/page.tsx        # Teacher login
    register/page.tsx     # 3-step registration (email → OTP → profile)
  (dashboard)/
    layout.tsx            # Sidebar + Header + main content
    page.tsx              # Dashboard home (stats, alerts, activity, chart)
    schedule/page.tsx     # Weekly schedule with session creation (Sheet)
    sessions/
      page.tsx            # Session list
      [id]/live/page.tsx  # Live attendance session (timer, recharts)
    students/page.tsx     # Student directory with search
    reports/page.tsx      # Attendance reports & export
    settings/page.tsx     # Teacher profile & preferences
components/
  ui/                     # Reusable UI primitives (shadcn/ui-style, hand-written)
  dashboard/              # Feature components (StatsCards, DashboardAlerts, etc.)
  layout/                 # App shell (Sidebar, Header)
lib/
  api.ts                  # SWR fetcher + useApi/usePolling hooks + API client
  auth-context.tsx        # AuthProvider + useAuth() hook
  mock-data.ts            # TypeScript interfaces + mock data arrays
  utils.ts                # cn() utility (clsx + tailwind-merge)
```

## Key Features

- **Dashboard** — Overview with stats cards, at-risk alerts, recent activity, attendance chart
- **Schedule** — Weekly view of teaching sessions (Cours/TD/TP) with session creation
- **Live Sessions** — Real-time attendance tracking with timer, RFID/QR scanning, and live pie chart
- **Students** — Searchable student directory with group/year filtering
- **Reports** — Attendance reports with data export
- **Settings** — Teacher profile and notification preferences
- **Auth** — Login, registration with OTP verification, auto-logout on 401

## Architecture Notes

- **No API routes** — All API calls go to an external NestJS backend
- **No ORM** — Data comes from the external API or `lib/mock-data.ts`
- **No tests** — No testing framework configured
- **Mock data mode** — Enabled by default; controlled by `NEXT_PUBLIC_USE_MOCK_DATA`
- **Custom auth** — JWT-based auth via React Context (no NextAuth/Clerk)
- **Tailwind v4** — Uses `@import "tailwindcss"` syntax, CSS-based config, no `tailwind.config.ts`

## Known Issues

1. `lib/utils.ts` is missing exports (`AuthUser`, `getAuthHeaders`, `logout`, `getCurrentUser`) needed by `auth-context.tsx` and `api.ts`
2. `BadgeProps` variant mismatch — `DashboardAlerts`/`RecentActivity` use `"present"`/`"late"`/`"absent"` but Badge only supports `"success"`/`"warning"`/`"destructive"`
3. No `error.tsx`, `loading.tsx`, or `not-found.tsx` boundary files
4. No `middleware.ts` for auth route protection

## Deployment

The easiest way to deploy is via [Vercel](https://vercel.com/new). See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for details. Make sure to set the environment variables in your deployment platform.
