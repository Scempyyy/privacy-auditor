"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCheck,
  IconCloudOff,
  IconFileSearch,
  IconLock,
  IconLockOpen,
  IconShieldCheck,
} from "@tabler/icons-react";
import { AnalysisReport, AndroidComponentFinding, DEMO_REPORT } from "@/lib/api";
import { getActiveReport } from "@/lib/history";

export default function AttackSurfacePage() {
  return (
    <Suspense fallback={<div className="page-wrap"><p className="text-slate-400 text-xs">Loading Attack Surface...</p></div>}>
      <AttackSurfaceView />
    </Suspense>
  );
}

function AttackSurfaceView() {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [filterType, setFilterType] = useState<"all" | "activity" | "service" | "receiver" | "provider">("all");
  const [filterExported, setFilterExported] = useState<"all" | "exported" | "unguarded">("all");

  useEffect(() => {
    const active = getActiveReport();
    setReport(active || DEMO_REPORT);
  }, []);

  const attackSurface = report?.attack_surface;
  const components: AndroidComponentFinding[] = attackSurface?.components || [];

  const filteredComponents = components.filter((c) => {
    if (filterType !== "all" && c.component_type !== filterType) return false;
    if (filterExported === "exported" && !c.is_exported) return false;
    if (filterExported === "unguarded" && (!c.is_exported || Boolean(c.permission))) return false;
    return true;
  });

  return (
    <section className="page-wrap space-y-8">
      {/* Hero Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/40 text-red-300 text-xs font-mono">
          <IconAlertTriangle size={14} /> Android IPC & Manifest Exposure Analyzer
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Attack Surface Explorer
        </h1>
        <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
          Inspects every Android component declared in <code className="text-purple-300">AndroidManifest.xml</code>.
          Reveals IPC attack vectors: exported Activities that can be launched by third-party apps, unauthenticated Broadcast Receivers,
          exposed Services, and Content Providers vulnerable to SQL injection or path traversal.
        </p>
      </div>

      {!attackSurface ? (
        <div className="report-card p-8 text-center space-y-4">
          <IconCloudOff size={32} className="mx-auto text-slate-500" />
          <h2 className="text-lg font-semibold text-white">No Attack Surface Data Available</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Scan an APK to inspect its manifest components, or inspect the demo report to see the analysis in action.
          </p>
          <Link href="/scanner" className="button-primary inline-flex items-center gap-2">
            <IconFileSearch size={16} /> Scan an APK
          </Link>
        </div>
      ) : (
        <>
          {/* Metrics summary banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <MetricCard
              label="Total Components"
              value={attackSurface.total_components}
              tone="text-slate-200"
            />
            <MetricCard
              label="Exported (Accessible)"
              value={attackSurface.exported_count}
              tone="text-amber-400"
              sub="Exposed to other apps"
            />
            <MetricCard
              label="Unguarded Exported"
              value={attackSurface.unprotected_count}
              tone={attackSurface.unprotected_count > 0 ? "text-red-400 font-bold" : "text-emerald-400"}
              sub="Zero permission check"
            />
            <MetricCard
              label="Activities"
              value={attackSurface.activities_count}
              tone="text-blue-400"
            />
            <MetricCard
              label="Services"
              value={attackSurface.services_count}
              tone="text-purple-400"
            />
            <MetricCard
              label="Receivers / Providers"
              value={`${attackSurface.receivers_count} / ${attackSurface.providers_count}`}
              tone="text-cyan-400"
            />
          </div>

          {/* Remediation & Risk Assessment Callout */}
          <div className={`p-4 rounded-xl border ${attackSurface.unprotected_count > 0 ? "bg-red-950/20 border-red-900/50" : "bg-emerald-950/20 border-emerald-900/40"}`}>
            <div className="flex items-start gap-3">
              <span className={`p-2 rounded-lg ${attackSurface.unprotected_count > 0 ? "bg-red-900/40 text-red-300" : "bg-emerald-900/40 text-emerald-300"}`}>
                {attackSurface.unprotected_count > 0 ? <IconAlertTriangle size={20} /> : <IconShieldCheck size={20} />}
              </span>
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-white">
                  {attackSurface.unprotected_count > 0
                    ? `Critical IPC Exposure Warning: ${attackSurface.unprotected_count} component(s) exported without permission guards`
                    : "No Unguarded Exported Components Detected"}
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {attackSurface.unprotected_count > 0
                    ? "Any other app installed on the user's device can interact with these components via explicit or implicit Intents without holding any permission. Verify if android:exported=\"false\" can be set, or protect them with android:permission with signature protection."
                    : "All declared exported components have explicit permission constraints or require signature authorization."}
                </p>
              </div>
            </div>
          </div>

          {/* Component Explorer Filter & Table */}
          <div className="report-card p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white">Component Breakdown</h2>
                <p className="text-xs text-slate-400">
                  Showing {filteredComponents.length} of {components.length} inspected manifest components
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-lg bg-slate-900/90 p-1 border border-slate-800 text-xs">
                  {(["all", "activity", "service", "receiver", "provider"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFilterType(t)}
                      className={`px-2.5 py-1 rounded capitalize font-medium transition ${
                        filterType === t ? "bg-purple-600 text-white" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="inline-flex rounded-lg bg-slate-900/90 p-1 border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterExported("all")}
                    className={`px-2 py-1 rounded font-medium transition ${
                      filterExported === "all" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterExported("exported")}
                    className={`px-2 py-1 rounded font-medium transition ${
                      filterExported === "exported" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Exported Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterExported("unguarded")}
                    className={`px-2 py-1 rounded font-medium transition ${
                      filterExported === "unguarded" ? "bg-red-600 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Unguarded Only
                  </button>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3">
              {filteredComponents.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No components match the selected filter.
                </div>
              ) : (
                filteredComponents.map((comp, idx) => (
                  <div
                    key={`${comp.component_type}-${comp.name}-${idx}`}
                    className="p-3.5 rounded-lg border border-slate-800/80 bg-[#0d0d16] hover:border-slate-700 transition space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                            comp.component_type === "activity" ? "bg-blue-950 text-blue-300 border border-blue-800/60" :
                            comp.component_type === "service" ? "bg-purple-950 text-purple-300 border border-purple-800/60" :
                            comp.component_type === "receiver" ? "bg-cyan-950 text-cyan-300 border border-cyan-800/60" :
                            "bg-amber-950 text-amber-300 border border-amber-800/60"
                          }`}>
                            {comp.component_type}
                          </span>
                          <span className="font-mono text-xs font-semibold text-slate-200 truncate">
                            {comp.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {comp.explanation}
                        </p>
                        {comp.remediation_hint && (
                          <p className="text-[11px] text-amber-400/90 font-mono">
                            Fix: {comp.remediation_hint}
                          </p>
                        )}
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-2 shrink-0">
                        {comp.is_exported ? (
                          comp.permission ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 text-[11px] font-mono">
                              <IconLock size={12} /> Exported (Guarded)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/60 text-[11px] font-mono">
                              <IconLockOpen size={12} /> Exported (Unguarded)
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[11px] font-mono">
                            <IconCheck size={12} /> Internal (Private)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-slate-400 pt-1 font-mono">
                      <div>
                        <span className="text-slate-500">Intent filter: </span>
                        <span className={comp.has_intent_filter ? "text-purple-300" : "text-slate-400"}>
                          {comp.has_intent_filter ? "Present" : "None"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Permission guard: </span>
                        <span className={comp.permission ? "text-emerald-400" : "text-slate-500"}>
                          {comp.permission || "None"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Risk level: </span>
                        <span className={
                          comp.risk_level === "high" ? "text-red-400 font-bold" :
                          comp.risk_level === "medium" ? "text-amber-400" : "text-slate-400"
                        }>
                          {comp.risk_level.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function MetricCard({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: number | string;
  tone: string;
  sub?: string;
}) {
  return (
    <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0c0d16] space-y-1">
      <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 truncate">
        {label}
      </div>
      <div className={`text-xl font-bold font-mono ${tone}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-400 truncate">{sub}</div>}
    </div>
  );
}
