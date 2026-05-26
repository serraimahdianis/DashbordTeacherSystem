<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may differ from older versions. Read `node_modules/next/dist/docs/` before writing code.
<!-- END:nextjs-agent-rules -->

# Teacher Kit - Agent Development Guide

Root: `../AGENTS.md` for monorepo-wide commands and cross-project context.

## Project Overview

**Smart Attendance Teacher Kit** — a university attendance management system for teachers. Manages weekly teaching schedules, live RFID/QR scanning sessions, student attendance tracking, and reports. Connects to a NestJS backend API at `NEXT_PUBLIC_API_URL`.

## Project Stack

- **Framework**: Next.js 16.2.4 (App Router with Turbopack)
- **React**: 19.x
- **Language**: TypeScript 5 (strict mode)
- **HTTP Client**: Axios with JWT interceptors
- **Styling**: Tailwind CSS v4 (CSS-based config in `globals.css`)
- **Linting**: ESLint 9 (flat config in `eslint.config.mjs`)
- **Data Fetching**: SWR + Axios fetcher
- **i18n**: next-intl with server-side dictionary loading
- **Form Validation**: react-hook-form + zod
- **Charts**: recharts
- **Icons**: lucide-react
- **Dates**: date-fns
- **Class merging**: clsx + tailwind-merge → `cn()` in `lib/utils.ts`
- **Auth**: Custom React Context (`lib/auth-context.tsx`)
- **No testing framework** — do not add tests

---

## Commands

```bash
npm run dev              # Dev server on http://localhost:3001
npm run build            # Production build
npm run start            # Start production server on http://localhost:3001
npm run lint             # Run ESLint
npx tsc --noEmit         # TypeScript type check
```

**Running tests**: No test framework is configured. Do not add tests.

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | NestJS backend URL |
| `NEXT_PUBLIC_USE_MOCK_DATA` | NOT used | All data comes from real API |

---

## Directory Structure

```
app/
  layout.tsx             # Root layout (Inter font, AuthProvider, LocaleProvider, metadata)
  globals.css            # Tailwind v4 + @theme + CSS custom properties
  page.tsx               # Landing page (public)
  (auth)/                # Route group - login & register pages
    login/page.tsx       # Login with email/password
    register/page.tsx    # OTP verification flow
  (dashboard)/          # Protected route group (requires auth)
    layout.tsx          # Sidebar (260px) + Header + main content
    page.tsx            # Dashboard home (stats, today's sessions)
    dashboard/page.tsx  # Session management (start sessions)
    schedule/page.tsx    # Schedule management (CRUD)
    sessions/
      page.tsx          # Session history
      [id]/live/page.tsx # Live polling page with recharts
    students/page.tsx    # Student search/management
    reports/page.tsx     # Export reports
    settings/page.tsx    # Profile settings
  error.tsx             # Error boundary
  loading.tsx            # Loading state
  not-found.tsx         # 404 page

components/
  ui/                    # Reusable UI primitives (shadcn/ui-style)
  dashboard/             # StatsCards, AttendanceChart, RecentActivity
  layout/                # Sidebar, Header

lib/
  utils.ts               # cn(), auth helpers (getToken, getCurrentUser, logout)
  api.ts                # Axios instance, SWR hooks, API client methods
  auth-context.tsx      # AuthProvider + useAuth() hook
  i18n.ts               # Server-side dictionary loading
  locale-context.tsx    # Client locale context (useTranslation)

dictionaries/
  en.json, fr.json, ar.json  # Translation files

types/
  api.ts               # Domain types (Teacher, Student, Session, etc.)
```

---

## API Layer (Axios + JWT)

```typescript
// lib/api.ts - Axios instance with JWT interceptors
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor - inject JWT token
axiosInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401 (logout on auth endpoints)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      if (!url.includes("/auth/")) {
        logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// SWR fetcher
export const fetcher = (url: string) =>
  axiosInstance.get(url).then((r) => r.data);

// SWR hooks
export function useApi<T>(url: string | null, options?: SWRConfiguration)
export function usePolling<T>(url: string | null, interval = 3000)
```

**Available API methods**: `authApi`, `teachersApi`, `studentsApi`, `modulesApi`, `schedulesApi`, `sessionsApi`, `attendanceApi`

---

## i18n (next-intl)

- **Server-side**: `lib/i18n.ts` loads dictionaries via `getDictionary()`
- **Client-side**: `lib/locale-context.tsx` provides `useTranslation()` hook
- **Supported locales**: `en`, `fr`, `ar`
- **RTL**: Auto-switches to RTL when Arabic is selected via `document.documentElement.dir`

```typescript
// Server component
import { getDictionary } from "@/lib/i18n";

export default async function Page() {
  const t = await getDictionary();
  return <h1>{t.dashboard.title}</h1>;
}

// Client component
import { useTranslation } from "@/lib/locale-context";

function Component() {
  const { t } = useTranslation();
  return <h1>{t.dashboard.title}</h1>;
}
```

---

## TypeScript Rules

- **`strict: true`** — all strict checks enabled
- **Never use `any`** — use `unknown` with proper type guards
- Use explicit return types for exported functions
- `interface` for object types — no `I` prefix
- `type` for union literals: `"present" | "late" | "absent"`, `"Cours" | "TD" | "TP"`
- **Path alias**: `@/*` maps to project root

---

## Import Order

1. `"use client"` directive (if needed, first line)
2. Next.js built-ins (`next/image`, `next/link`, `next/navigation`)
3. React (`useState`, `useEffect`, `React`, `createContext`)
4. External libraries (`date-fns`, `recharts`, `swr`, `lucide-react`, `axios`)
5. Internal modules (`@/components/ui/*`, `@/lib/*`, `@/types/*`)
6. Type imports (`import type`)

---

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Page files | `page.tsx` | `app/(dashboard)/sessions/page.tsx` |
| UI primitive files | lowercase | `button.tsx`, `card.tsx`, `badge.tsx` |
| Feature component files | PascalCase | `StatsCards.tsx`, `RecentActivity.tsx` |
| Lib files | kebab-case | `api.ts`, `auth-context.tsx`, `utils.ts` |
| Page components | `export default function XPage()` | `SessionsPage` |
| Feature components | `export function X()` | `StatsCards()` |
| UI primitives | `const X = forwardRef()` + `export { X }` | `Button`, `Card` |
| Hooks | `use*` prefix | `useAuth()`, `useApi()`, `useTranslation()` |
| Interfaces | PascalCase, no `I` prefix | `Teacher`, `Student`, `ButtonProps` |

---

## Server vs Client Components

- **Server Components by default** (no `"use client"` directive)
- Add `"use client"` when using:
  - `useState`, `useReducer`, `useEffect`
  - Event handlers (`onClick`, `onChange`, `onSubmit`)
  - Browser-only APIs (`localStorage`, `window`)
  - React Context (`createContext`, `useContext`)
  - recharts (requires DOM)
- **Client pages**: `login`, `register`, `schedule`, `students`, `settings`, `sessions/[id]/live`, `dashboard`
- **Server pages**: `page.tsx` (landing), `sessions` (list), `reports`

---

## Styling (Tailwind v4)

- Uses `@import "tailwindcss"` syntax (NOT `@tailwind base/components/utilities`)
- Custom design tokens in `@theme` block in `app/globals.css`
- **Primary color**: `violet-600/700` (buttons, sidebar, accents)
- **Status colors**: `emerald` = present, `amber` = late, `red` = absent
- Use `cn()` from `@/lib/utils` for conditional class merging
- Always accept and merge `className` prop

---

## Error Handling

```typescript
// API layer - throw on non-2xx, handle 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      if (!url.includes("/auth/")) {
        logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Context hooks - throw if used outside provider
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

// Async functions - handle errors, return null on failure
async function getData(id: string): Promise<Data | null> {
  try {
    return await fetchData(id);
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return null;
  }
}
```

---

## Data Fetching (SWR + Axios)

```typescript
import { useApi, usePolling, fetcher } from "@/lib/api";

// Standard fetch with SWR caching (no auto-refresh)
const { data, error, isLoading } = useApi<Session[]>(
  user?.id ? `/sessions/teacher/${user.id}` : null
);

// Polling for live data (default 3s interval)
const { data } = usePolling<AttendanceRecord[]>(
  `/attendance/session/${sessionId}`,
  3000
);
```

---

## Key Patterns

**Auth login flow**:
1. Call `authApi.login(email, password)` → get JWT
2. Decode JWT to get teacher ID
3. Fetch full teacher profile via `teachersApi.getById(id)`
4. Store user + token in localStorage via `setCurrentUser()`
5. Redirect to `/dashboard`

**Starting a session**:
1. Call `sessionsApi.startFromSchedule(scheduleId)` → creates session
2. Redirect to `/sessions/{sessionId}/live`
3. Live page uses `usePolling` to fetch attendance every 3s

**i18n switch**:
1. User clicks language button → `setLocale(newLocale)`
2. Sets cookie + updates `document.documentElement.dir`
3. Triggers page reload to fetch new dictionary

---

## Known Issues (Resolved)

1. ~~`any` types in api.ts~~ — Fixed with explicit types
2. ~~Badge variant mismatch~~ — Badge uses `"outline"` with custom classes
3. ~~Missing middleware~~ — Auth redirects handled in auth-context
4. ~~Unused imports~~ — All lint warnings resolved

---

## Key Notes

1. **No mock data** — `NEXT_PUBLIC_USE_MOCK_DATA` is NOT used
2. **Axios + JWT** — All API calls use Axios instance with token injectors
3. **No API routes** — All API calls go to external NestJS backend
4. **Port 3001** — Dev and production servers use port 3001
5. **External backend** — NestJS API at `NEXT_PUBLIC_API_URL`

---

## When to Ask

- Adding dependencies (`npm install`)
- Creating new pages/routes
- Modifying auth flow or API client
- Adding new i18n translations
- Deploying to production