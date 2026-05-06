import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { LocaleProvider } from "@/lib/locale-context";
import { getDictionary, getLocale } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Attendance — Teacher Kit",
  description: "University attendance management with RFID scanning. Manage schedules, run live sessions, and export reports.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const dictionary = await getDictionary();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body className={inter.className}>
        <LocaleProvider initialDictionary={dictionary} initialLocale={locale}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
