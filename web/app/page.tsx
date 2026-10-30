export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background ambient cybersecurity grid glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Navigation / Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono text-sm font-bold shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              🛡️
            </div>
            <div className="flex flex-col">
              <span className="font-semibold tracking-tight text-slate-100 text-base">
                Android Privacy Auditor
              </span>
              <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">
                Static APK Security Analysis
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Backend Ready: /health ok</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center">
        {/* Under Development Alert Banner */}
        <div className="mb-10 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm flex items-start space-x-4 shadow-[0_0_20px_rgba(245,158,11,0.08)]">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 text-xl font-mono">
            ⚠️
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-amber-300 uppercase tracking-wide">
              Module 0: Foundation Complete — Analyzer Under Development
            </h2>
            <p className="mt-1 text-sm text-slate-300 leading-relaxed">
              The project scaffold, FastAPI backend service, deterministic scoring models, and Next.js frontend are initialized. The static APK parsing engine and signature detectors are being implemented in subsequent modules.
            </p>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-6">
            <span>Deterministic Privacy Intelligence</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-6">
            Transparent Privacy Audits for Android APKs
          </h1>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            Android Privacy Auditor performs purely static inspections on Android application packages (<code className="text-cyan-300 font-mono text-sm bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">base.apk</code>) to uncover declared permissions, trace embedded third-party tracker SDKs, and calculate an explainable 0–100 privacy score.
          </p>
        </div>

        {/* Core Pillars / Architecture Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1 */}
          <div className="p-6 rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm hover:border-slate-700/80 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-lg mb-4">
              📦
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Static APK Parsing</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Extracts package metadata, version codes, minimum/target SDKs, and manifest security hygiene flags without ever executing the APK.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm hover:border-slate-700/80 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg mb-4">
              🔍
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Tracker & Ad SDK Detection</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Scans DEX bytecode against a curated signature database to identify advertising, profiling, behavioral analytics, and telemetry libraries.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm hover:border-slate-700/80 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 text-lg mb-4">
              📊
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Deterministic Scoring</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Calculates an objective 0–100 privacy grade with transparent point-by-point deductions and step-by-step permission revocation instructions.
            </p>
          </div>
        </div>

        {/* Planned Workflow / Pipeline Preview */}
        <div className="rounded-xl border border-slate-800/90 bg-slate-900/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">
              Static Analysis Pipeline (Specification 1.0)
            </span>
            <span className="text-xs font-mono text-cyan-400">Offline & Local Only</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-mono">
              <span className="text-slate-500 block mb-1">01 / INGEST</span>
              <span className="text-slate-200">Upload base.apk</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-mono">
              <span className="text-slate-500 block mb-1">02 / PARSE</span>
              <span className="text-slate-200">Manifest & SDK</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-mono">
              <span className="text-slate-500 block mb-1">03 / SIGNATURES</span>
              <span className="text-slate-200">Trackers & Perms</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/70 border border-cyan-800/50 text-xs font-mono bg-cyan-950/20">
              <span className="text-cyan-400 block mb-1">04 / SCORE</span>
              <span className="text-cyan-200 font-semibold">0–100 Grade</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/60 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <div>
            <span>Android Privacy Auditor — Local Privacy Analysis Tool</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Arch Linux Development</span>
            <span>•</span>
            <span>No Telemetry</span>
            <span>•</span>
            <span>Deterministic Heuristic</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
