import Link from "next/link";
import { GraduationCap, Wifi, BarChart3, CreditCard, ArrowRight, CheckCircle } from "lucide-react";
import { getDictionary } from "@/lib/i18n";

export default async function LandingPage() {
  const t = await getDictionary();
  const l = t.landing;

  const features = [
    {
      icon: CreditCard,
      title: l.feature1Title,
      desc: l.feature1Desc,
      color: "from-violet-500 to-violet-700",
      bg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      icon: Wifi,
      title: l.feature2Title,
      desc: l.feature2Desc,
      color: "from-emerald-500 to-emerald-700",
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      icon: BarChart3,
      title: l.feature3Title,
      desc: l.feature3Desc,
      color: "from-blue-500 to-blue-700",
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
  ];

  const steps = [
    { n: "01", title: l.step1, desc: l.step1Desc },
    { n: "02", title: l.step2, desc: l.step2Desc },
    { n: "03", title: l.step3, desc: l.step3Desc },
    { n: "04", title: l.step4, desc: l.step4Desc },
  ];

  const stats = [
    { value: "99%", label: "Accuracy" },
    { value: "<1s", label: "Scan Speed" },
    { value: "3", label: "Languages" },
    { value: "24/7", label: "Available" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5 font-bold text-gray-900">
            <div className="h-8 w-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span>Smart<span className="text-violet-600">Attendance</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              {l.login}
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors px-4 py-2 rounded-lg"
            >
              {l.getStarted}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-violet-100 opacity-50 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-blue-100 opacity-40 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-full px-4 py-1.5 text-sm font-medium text-violet-700 mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
              RFID-Powered Attendance System
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
              {l.heroTitle.split(" ").slice(0, 3).join(" ")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-violet-400">
                {l.heroTitle.split(" ").slice(3).join(" ")}
              </span>
            </h1>
            <p className="mt-6 text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
              {l.heroSubtitle}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300"
              >
                {l.getStarted}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-xl border border-gray-200 transition-all"
              >
                {l.login}
              </Link>
            </div>
          </div>

          {/* Dashboard preview card */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-gray-200 border border-gray-100">
              <div className="bg-gradient-to-br from-violet-600 to-violet-900 p-6 sm:p-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {stats.map((s) => (
                    <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl p-4 text-center text-white">
                      <div className="text-2xl font-extrabold">{s.value}</div>
                      <div className="text-xs text-violet-200 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 bg-white/10 rounded-xl p-4 flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white text-sm font-medium">Live session active — 23 students scanned</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">{l.featuresTitle}</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">{l.featuresSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className={`h-12 w-12 ${f.bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`h-6 w-6 ${f.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{f.title}</h3>
                <p className="mt-3 text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">{l.howTitle}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={step.n} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-0.5 bg-gradient-to-r from-violet-200 to-transparent z-0" />
                )}
                <div className="relative z-10">
                  <div className="h-12 w-12 rounded-xl bg-violet-600 text-white font-black text-sm flex items-center justify-center mb-4">
                    {step.n}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 bg-gradient-to-br from-violet-600 to-violet-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-extrabold">Ready to modernize attendance?</h2>
          <p className="mt-4 text-violet-200 text-lg">Join universities using Smart Attendance today.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-violet-200">
            {["No credit card required", "Free to get started", "RFID hardware compatible"].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                {item}
              </span>
            ))}
          </div>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-violet-700 font-bold rounded-xl hover:bg-violet-50 transition-colors"
            >
              {l.getStarted}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 bg-violet-500/40 hover:bg-violet-500/60 text-white font-semibold rounded-xl border border-violet-400 transition-colors"
            >
              {l.login}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-bold">
            <div className="h-7 w-7 bg-violet-600 rounded-md flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            SmartAttendance
          </div>
          <p className="text-gray-400 text-sm">{l.footer}</p>
        </div>
      </footer>
    </div>
  );
}
