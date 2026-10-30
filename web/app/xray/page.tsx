"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconSearch,
  IconFilter,
  IconCode,
  IconFileCode,
  IconAlertCircle,
  IconEye,
  IconArrowRight,
  IconCpu,
} from "@tabler/icons-react";
import { AnalysisReport, PermissionXRayFinding } from "@/lib/api";
import { getLatestScan } from "@/lib/history";

export default function PrivacyXRayPage() {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "api_reference_found" | "no_reference_observed" | "not_assessed">("all");
  const [selectedFinding, setSelectedFinding] = useState<PermissionXRayFinding | null>(null);

  useEffect(() => {
    const latest = getLatestScan();
    if (latest) {
      setReport(latest);
      if (latest.privacy_xray?.findings?.length) {
        setSelectedFinding(latest.privacy_xray.findings[0]);
      }
    }
  }, []);

  const xray = report?.privacy_xray;

  const filteredFindings = (xray?.findings || []).filter((f) => {
    if (filter !== "all" && f.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchPerm = f.permission.toLowerCase().includes(q);
      const matchEvidence = f.evidence.some(
        (e) =>
          e.caller_class.toLowerCase().includes(q) ||
          e.caller_method.toLowerCase().includes(q) ||
          e.referenced_api_class.toLowerCase().includes(q) ||
          e.referenced_method.toLowerCase().includes(q)
      );
      if (!matchPerm && !matchEvidence) return false;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-purple-950/40">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-widest">
            <IconCpu size={15} /> Privacy X-Ray • Bytecode Investigation
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
            Permission-to-Code Evidence
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Inspect compiled Dalvik bytecode (DEX) to reveal static method callsites and framework API references associated with declared Android permissions.
          </p>
        </div>
        {report && (
          <div className="bg-purple-950/30 border border-purple-800/40 rounded-lg p-3 text-right">
            <span className="text-xs text-slate-400 block font-mono">Audited Target:</span>
            <span className="text-sm font-semibold text-purple-300 block truncate max-w-xs">
              {report.app_name || report.package_name}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              v{report.version_name || "1.0"} ({report.version_code || 1})
            </span>
          </div>
        )}
      </div>

      {/* Static Analysis Disclaimer */}
      <div className="p-4 rounded-lg bg-amber-950/30 border border-amber-800/50 flex items-start gap-3 text-amber-200/90 text-xs leading-relaxed">
        <IconAlertCircle size={18} className="shrink-0 text-amber-400 mt-0.5" />
        <div>
          <strong className="font-semibold text-amber-300">Technical Static Analysis Disclaimer:</strong> A DEX API reference or callsite indicates compiled static bytecode evidence, not proof of runtime execution or active data exfiltration. Conversely, the absence of an observed API reference (&apos;no_reference_observed&apos;) does not prove a permission is unused; the app may invoke functionality via reflection, native JNI binaries, or dynamic code loading.
        </div>
      </div>

      {!report || !xray ? (
        <div className="text-center py-16 bg-[#101018] border border-purple-900/30 rounded-xl space-y-4">
          <IconFileCode size={48} className="mx-auto text-purple-400/60" />
          <h2 className="text-lg font-semibold text-white">No active APK audit loaded</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Scan an Android package in the scanner or view a previous audit from the dashboard to investigate its DEX bytecode evidence.
          </p>
          <div className="pt-2">
            <Link href="/scanner" className="button-primary inline-flex items-center gap-2 text-sm">
              Launch Scanner <IconArrowRight size={16} />
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Metrics bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-[#12121c] border border-purple-900/30">
              <span className="text-xs text-slate-400 font-mono block">Permissions Inspected</span>
              <span className="text-2xl font-bold text-white mt-1 block">
                {xray.total_permissions_examined}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-[#12121c] border border-emerald-900/40">
              <span className="text-xs text-emerald-400 font-mono block">API References Discovered</span>
              <span className="text-2xl font-bold text-emerald-300 mt-1 block">
                {xray.permissions_with_references}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-[#12121c] border border-slate-800">
              <span className="text-xs text-slate-400 font-mono block">No Reference Observed</span>
              <span className="text-2xl font-bold text-slate-300 mt-1 block">
                {xray.permissions_no_reference_observed}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-[#12121c] border border-purple-950/60">
              <span className="text-xs text-purple-400 font-mono block">DEX Files Covered</span>
              <span className="text-sm font-semibold text-purple-200 mt-2 block font-mono">
                {xray.dex_coverage.join(", ")}
              </span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search permission, class, or method..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#12121c] border border-purple-900/40 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs">
              <span className="text-slate-500 mr-1 flex items-center gap-1 font-mono">
                <IconFilter size={13} /> Filter:
              </span>
              {(["all", "api_reference_found", "no_reference_observed", "not_assessed"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilter(mode)}
                  className={`px-2.5 py-1 rounded font-mono text-[11px] whitespace-nowrap transition-colors ${
                    filter === mode
                      ? "bg-purple-900/80 text-purple-200 border border-purple-600"
                      : "bg-[#12121c] text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {mode === "all" ? "All" : mode.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Split Pane: Findings List & Technical Evidence Graph */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* List */}
            <div className="lg:col-span-5 space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredFindings.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-[#12121c] rounded-lg border border-purple-950/40">
                  No permission findings match your current search/filter.
                </div>
              ) : (
                filteredFindings.map((f) => {
                  const isSelected = selectedFinding?.permission === f.permission;
                  const hasRef = f.status === "api_reference_found";
                  return (
                    <div
                      key={f.permission}
                      onClick={() => setSelectedFinding(f)}
                      className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-purple-950/40 border-purple-500 shadow-md shadow-purple-950/20"
                          : "bg-[#12121c] border-purple-950/30 hover:border-purple-800/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-white truncate">
                          {f.permission.replace("android.permission.", "")}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            hasRef
                              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                              : f.status === "no_reference_observed"
                              ? "bg-slate-800 text-slate-400 border border-slate-700"
                              : "bg-purple-950/60 text-purple-400 border border-purple-900/40"
                          }`}
                        >
                          {f.status === "api_reference_found"
                            ? `${f.evidence.length} callsite(s)`
                            : f.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {f.summary}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Evidence Detail / Graph Pane */}
            <div className="lg:col-span-7 bg-[#12121c] border border-purple-950/40 rounded-xl p-5 space-y-4">
              {selectedFinding ? (
                <>
                  <div className="border-b border-purple-900/30 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-purple-400">Examined Permission:</span>
                      <code className="text-xs text-purple-200 bg-purple-950/60 px-2 py-0.5 rounded">
                        {selectedFinding.permission}
                      </code>
                    </div>
                    <p className="text-xs text-slate-300 mt-2">{selectedFinding.summary}</p>
                  </div>

                  {selectedFinding.evidence.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-xs font-mono uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                        <IconCode size={14} /> Bytecode Callsite Trace ({selectedFinding.evidence.length})
                      </h3>
                      <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                        {selectedFinding.evidence.map((ev, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 bg-[#0b0b12] border border-purple-900/30 rounded-lg space-y-2 text-xs font-mono"
                          >
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span className="text-purple-400 font-semibold">{ev.dex_file}</span>
                              <span className="bg-purple-950/80 text-purple-300 px-1.5 py-0.5 rounded text-[10px] border border-purple-800/40">
                                {ev.instruction_name}
                              </span>
                            </div>

                            {/* Call trace visual flow */}
                            <div className="p-2.5 rounded bg-black/40 border border-slate-800/60 space-y-1.5 text-[11px]">
                              <div>
                                <span className="text-slate-500">Caller Class: </span>
                                <span className="text-slate-200 break-all">{ev.caller_class}</span>
                              </div>
                              <div>
                                <span className="text-slate-500">Caller Method: </span>
                                <span className="text-amber-300">{ev.caller_method}</span>
                                {ev.caller_descriptor && (
                                  <span className="text-slate-500 text-[10px] block truncate">{ev.caller_descriptor}</span>
                                )}
                              </div>
                              <div className="pt-1 border-t border-slate-800/50">
                                <span className="text-purple-400">→ Referenced Android API: </span>
                                <span className="text-emerald-300 font-bold break-all">
                                  {ev.referenced_api_class}::{ev.referenced_method}
                                </span>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-400 font-sans">{ev.description}</p>
                            <div className="text-[10px] text-slate-500 flex items-center gap-2">
                              <span>Evidence: {ev.evidence_level.replace(/_/g, " ")}</span>
                              <span>•</span>
                              <a
                                href={ev.source}
                                target="_blank"
                                rel="noreferrer"
                                className="text-purple-400 hover:underline"
                              >
                                Official Doc Reference ↗
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                      <IconEye size={32} className="mx-auto text-slate-600" />
                      <p>No direct Dalvik bytecode method references were indexed or observed for this permission.</p>
                      <p className="text-[11px] text-slate-600 max-w-sm mx-auto">
                        This indicates that standard SDK API entry points were not matched in the decompiled DEX tables.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Select a permission finding to view technical bytecode evidence.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
