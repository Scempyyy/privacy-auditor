"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCheck,
  IconCircleCheck,
  IconCloudOff,
  IconCpu,
  IconFileSearch,
  IconHierarchy2,
  IconInfoCircle,
  IconLock,
  IconShieldCheck,
  IconX,
} from "@tabler/icons-react";
import { AnalysisReport, DEMO_REPORT, PrivacyRealityItem } from "@/lib/api";
import { getActiveReport } from "@/lib/history";

export default function PrivacyRealityPage() {
  return (
    <Suspense fallback={<div className="page-wrap"><p className="text-slate-400 text-xs">Loading Privacy Reality Engine...</p></div>}>
      <PrivacyRealityView />
    </Suspense>
  );
}

function PrivacyRealityView() {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "referenced" | "declared_only">("all");
  const [expandedCap, setExpandedCap] = useState<string | null>(null);

  useEffect(() => {
    const active = getActiveReport();
    setReport(active || DEMO_REPORT);
  }, []);

  const reality = report?.privacy_reality;
  const items: PrivacyRealityItem[] = reality?.items || [];

  const filteredItems = items.filter((item) => {
    if (filterMode === "referenced") return item.classification === "declared_and_referenced";
    if (filterMode === "declared_only") return item.classification === "declared_only_no_static_call";
    return true;
  });

  return (
    <section className="page-wrap space-y-8">
      {/* Hero Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/40 text-purple-300 text-xs font-mono">
          <IconHierarchy2 size={14} /> Multi-Layer Evidence Engine
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Privacy Reality Engine
        </h1>
        <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
          Replaces superficial permission lists with an evidence-driven model that distinguishes what an application
          <strong> declares</strong> in its manifest, what its compiled Dalvik bytecode <strong>statically references</strong>,
          what <strong>data-flow analysis</strong> can establish, and what an <strong>isolated sandbox session</strong> actually observes.
        </p>
      </div>

      {/* 5 Layer Architecture Diagram */}
      <div className="report-card p-6 space-y-4 border-purple-900/30">
        <h2 className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
          The 5 Evidence Layers of Android Privacy Intelligence
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs font-mono">
          <div className="p-3.5 rounded-lg bg-[#0e0f1a] border border-blue-900/40 space-y-1">
            <span className="text-[10px] text-blue-400 block font-bold">LAYER 1</span>
            <div className="text-slate-200 font-semibold">DECLARED</div>
            <p className="text-[10px] text-slate-400 font-sans">
              Permissions requested in AndroidManifest.xml.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0e0f1a] border border-emerald-900/40 space-y-1">
            <span className="text-[10px] text-emerald-400 block font-bold">LAYER 2</span>
            <div className="text-slate-200 font-semibold">STATIC REFERENCES</div>
            <p className="text-[10px] text-slate-400 font-sans">
              Compiled DEX method callsites referencing framework APIs.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0e0f1a] border border-purple-900/40 space-y-1">
            <span className="text-[10px] text-purple-400 block font-bold">LAYER 3</span>
            <div className="text-slate-200 font-semibold">DATA FLOW</div>
            <p className="text-[10px] text-slate-400 font-sans">
              Static taint analysis connecting sensitive sources to sinks.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0e0f1a] border border-amber-900/40 space-y-1">
            <span className="text-[10px] text-amber-400 block font-bold">LAYER 4</span>
            <div className="text-slate-200 font-semibold">RUNTIME OBSERVED</div>
            <p className="text-[10px] text-slate-400 font-sans">
              Active invocations and traffic captured in a disposable sandbox.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0e0f1a] border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold">LAYER 5</span>
            <div className="text-slate-200 font-semibold">INCONCLUSIVE</div>
            <p className="text-[10px] text-slate-400 font-sans">
              Capabilities unobserved due to reflection or dynamic loading.
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0c0d16] space-y-1">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Total Declared</div>
          <div className="text-2xl font-bold font-mono text-white">
            {reality?.total_capabilities_assessed ?? 0}
          </div>
          <div className="text-[11px] text-slate-400">In AndroidManifest.xml</div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-900/30 bg-[#0c0d16] space-y-1">
          <div className="text-[10px] uppercase font-mono tracking-wider text-emerald-400">Bytecode Referenced</div>
          <div className="text-2xl font-bold font-mono text-emerald-300">
            {reality?.total_statically_referenced ?? 0}
          </div>
          <div className="text-[11px] text-slate-400">Confirmed API callsites in DEX</div>
        </div>

        <div className="p-4 rounded-xl border border-amber-900/30 bg-[#0c0d16] space-y-1">
          <div className="text-[10px] uppercase font-mono tracking-wider text-amber-400">Declared Only</div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {reality?.total_declared_only ?? 0}
          </div>
          <div className="text-[11px] text-slate-400">No static framework calls observed</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-[#0c0d16] space-y-1">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Data-Flow / Sandbox</div>
          <div className="text-2xl font-bold font-mono text-purple-300">
            Opt-In
          </div>
          <div className="text-[11px] text-slate-400">Isolated lab testing required</div>
        </div>
      </div>

      {/* Interactive Reality Breakdown Table */}
      <div className="report-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white">Correlated Capabilities & Reality Status</h2>
            <p className="text-xs text-slate-400">
              Showing {filteredItems.length} of {items.length} analyzed permissions for {report?.package_name}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="inline-flex rounded-lg bg-slate-900/90 p-1 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1 rounded font-medium transition ${
                filterMode === "all" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("referenced")}
              className={`px-3 py-1 rounded font-medium transition ${
                filterMode === "referenced" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Referenced in DEX ({reality?.total_statically_referenced ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("declared_only")}
              className={`px-3 py-1 rounded font-medium transition ${
                filterMode === "declared_only" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Declared Only ({reality?.total_declared_only ?? 0})
            </button>
          </div>
        </div>

        {/* List of Reality Items */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No capabilities match the selected filter.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isExpanded = expandedCap === item.capability_name;
              const hasRef = item.layer2_statically_referenced;

              return (
                <div
                  key={`${item.capability_name}-${idx}`}
                  className="p-4 rounded-xl border border-slate-800/80 bg-[#0d0d16] hover:border-slate-700 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-white truncate">
                          {item.capability_name.replace("android.permission.", "")}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ({item.capability_name})
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {item.verdict_explanation}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {hasRef ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-xs font-mono font-medium">
                          <IconCheck size={14} /> Referenced ({item.callsites_count} calls)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60 text-xs font-mono font-medium">
                          <IconInfoCircle size={14} /> Declared Only
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 5-Layer Indicators */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 font-mono text-[10px]">
                    <div className="p-2 rounded bg-[#0a0b12] border border-blue-900/30 flex items-center justify-between">
                      <span className="text-slate-400">L1 Declared:</span>
                      <span className="text-blue-400 font-bold">YES</span>
                    </div>
                    <div className="p-2 rounded bg-[#0a0b12] border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">L2 Bytecode:</span>
                      <span className={hasRef ? "text-emerald-400 font-bold" : "text-slate-500"}>
                        {hasRef ? "CONFIRMED" : "UNOBSERVED"}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[#0a0b12] border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">L3 Data Flow:</span>
                      <span className="text-slate-500">OPTIONAL</span>
                    </div>
                    <div className="p-2 rounded bg-[#0a0b12] border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">L4 Runtime:</span>
                      <span className="text-slate-500">UNOBSERVED</span>
                    </div>
                    <div className="p-2 rounded bg-[#0a0b12] border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">L5 Status:</span>
                      <span className={hasRef ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                        {hasRef ? "CORRELATED" : "REVIEW"}
                      </span>
                    </div>
                  </div>

                  {/* Expandable Callsites sample */}
                  {item.callsites_sample.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => setExpandedCap(isExpanded ? null : item.capability_name)}
                        className="text-xs text-purple-400 hover:text-purple-300 font-mono inline-flex items-center gap-1"
                      >
                        {isExpanded ? "Hide Callsites" : `Show Sample Bytecode Callsites (${item.callsites_sample.length})`}
                        <IconArrowRight size={12} className={isExpanded ? "rotate-90 transition" : "transition"} />
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-3 rounded-lg bg-[#0a0b12] border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                          {item.callsites_sample.map((cs, cIdx) => (
                            <div key={cIdx} className="flex items-center gap-2 text-slate-300">
                              <span className="text-purple-400">→</span>
                              <code>{cs}</code>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
