"use client";

import { useState } from "react";
import {
  IconRadar,
  IconUpload,
  IconArrowRight,
  IconAlertTriangle,
  IconShieldCheck,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconDownload,
  IconCheck,
  IconX,
  IconRefresh,
} from "@tabler/icons-react";
import {
  compareApkVersions,
  RadarComparisonReport,
  AppCategory,
  CATEGORY_OPTIONS,
} from "@/lib/api";

export default function PrivacyRadarPage() {
  const [oldFile, setOldFile] = useState<File | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [category, setCategory] = useState<AppCategory>("utility");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [comparison, setComparison] = useState<RadarComparisonReport | null>(null);

  async function handleCompare() {
    setError("");
    if (!oldFile || !newFile) {
      setError("Please select both earlier and newer APK packages to compare.");
      return;
    }

    setBusy(true);
    try {
      const res = await compareApkVersions(oldFile, newFile, category);
      setComparison(res);
    } catch (err: any) {
      setError(err?.message || "Version comparison failed.");
    } finally {
      setBusy(false);
    }
  }

  function downloadJson() {
    if (!comparison) return;
    const blob = new Blob([JSON.stringify(comparison, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `privacy-radar-${comparison.package_name}-diff.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-purple-950/40">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest">
          <IconRadar size={15} /> Privacy Update Radar • Release Differential
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
          Comparative Privacy Posture
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Upload two consecutive releases of the same Android application to audit differential changes in declared permissions, tracker signatures, security controls, and privacy scores.
        </p>
      </div>

      {/* Upload & Compare Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Old Version Upload */}
        <div className="p-5 rounded-xl bg-[#12121c] border border-purple-950/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-purple-400 uppercase tracking-wider font-semibold">
              Step 1: Baseline / Earlier APK
            </span>
            {oldFile && (
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                <IconCheck size={13} /> Selected
              </span>
            )}
          </div>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              oldFile
                ? "border-purple-600 bg-purple-950/20"
                : "border-slate-800 hover:border-purple-900/60 bg-[#0c0c14]"
            }`}
            onClick={() => document.getElementById("old-apk-input")?.click()}
          >
            <input
              id="old-apk-input"
              type="file"
              accept=".apk"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) setOldFile(e.target.files[0]);
              }}
            />
            <IconUpload size={28} className="mx-auto text-purple-400/80 mb-2" />
            <span className="text-xs font-semibold text-white block">
              {oldFile ? oldFile.name : "Choose Earlier Version APK"}
            </span>
            <span className="text-[11px] text-slate-500 font-mono mt-1 block">
              {oldFile ? `${(oldFile.size / (1024 * 1024)).toFixed(2)} MB` : "e.g. app-v1.0.apk"}
            </span>
          </div>
        </div>

        {/* New Version Upload */}
        <div className="p-5 rounded-xl bg-[#12121c] border border-cyan-950/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Step 2: Updated / Newer APK
            </span>
            {newFile && (
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                <IconCheck size={13} /> Selected
              </span>
            )}
          </div>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              newFile
                ? "border-cyan-600 bg-cyan-950/20"
                : "border-slate-800 hover:border-cyan-900/60 bg-[#0c0c14]"
            }`}
            onClick={() => document.getElementById("new-apk-input")?.click()}
          >
            <input
              id="new-apk-input"
              type="file"
              accept=".apk"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) setNewFile(e.target.files[0]);
              }}
            />
            <IconUpload size={28} className="mx-auto text-cyan-400/80 mb-2" />
            <span className="text-xs font-semibold text-white block">
              {newFile ? newFile.name : "Choose Newer Version APK"}
            </span>
            <span className="text-[11px] text-slate-500 font-mono mt-1 block">
              {newFile ? `${(newFile.size / (1024 * 1024)).toFixed(2)} MB` : "e.g. app-v2.0.apk"}
            </span>
          </div>
        </div>
      </div>

      {/* Category & Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#10101a] border border-purple-950/50">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="radar-category-select" className="text-xs text-slate-400 font-mono whitespace-nowrap">Category:</label>
          <select
            id="radar-category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value as AppCategory)}
            className="bg-[#161622] border border-purple-900/40 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleCompare}
          disabled={busy || !oldFile || !newFile}
          className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-xs font-semibold hover:from-purple-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 transition-all"
        >
          {busy ? (
            <>
              <IconRefresh size={15} className="animate-spin" /> Analyzing Bytecode Diff...
            </>
          ) : (
            <>
              Run Differential Audit <IconArrowRight size={15} />
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center gap-2">
          <IconAlertTriangle size={16} className="text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-6 pt-4">
          {/* Summary Banner */}
          <div className="p-5 rounded-xl bg-[#12121c] border border-purple-900/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-950/40 pb-3">
              <div>
                <span className="text-xs font-mono text-cyan-400">Package Diff Verified</span>
                <h2 className="text-lg font-bold text-white font-mono">{comparison.package_name}</h2>
              </div>
              <button
                onClick={downloadJson}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-white font-mono transition-colors self-start sm:self-auto"
              >
                <IconDownload size={14} /> Download Diff JSON
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{comparison.summary_text}</p>
          </div>

          {/* Score Movement & Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Score Delta */}
            <div className="p-4 rounded-xl bg-[#12121c] border border-purple-900/30 space-y-1">
              <span className="text-xs text-slate-400 font-mono block">Privacy Score Movement</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-white font-mono">
                  {comparison.score_change.new_score}
                </span>
                <span className="text-xs text-slate-500 font-mono">/ 100</span>
                <span
                  className={`text-xs font-bold font-mono px-2 py-0.5 rounded ml-auto flex items-center gap-0.5 ${
                    comparison.score_change.difference > 0
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      : comparison.score_change.difference < 0
                      ? "bg-red-950 text-red-300 border border-red-800"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {comparison.score_change.difference > 0 ? (
                    <IconTrendingUp size={14} />
                  ) : comparison.score_change.difference < 0 ? (
                    <IconTrendingDown size={14} />
                  ) : (
                    <IconMinus size={14} />
                  )}
                  {comparison.score_change.difference > 0 ? `+${comparison.score_change.difference}` : comparison.score_change.difference}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block pt-1">
                {comparison.score_change.old_grade} → {comparison.score_change.new_grade}
              </span>
            </div>

            {/* Added Permissions */}
            <div className="p-4 rounded-xl bg-[#12121c] border border-red-900/30">
              <span className="text-xs text-red-400 font-mono block">Added Permissions</span>
              <span className="text-2xl font-bold text-red-300 mt-2 block font-mono">
                +{comparison.added_permissions.length}
              </span>
              <span className="text-[11px] text-slate-500 block pt-1">
                {comparison.retained_permissions_count} retained permissions
              </span>
            </div>

            {/* Removed Permissions */}
            <div className="p-4 rounded-xl bg-[#12121c] border border-emerald-900/30">
              <span className="text-xs text-emerald-400 font-mono block">Removed Permissions</span>
              <span className="text-2xl font-bold text-emerald-300 mt-2 block font-mono">
                -{comparison.removed_permissions.length}
              </span>
              <span className="text-[11px] text-slate-500 block pt-1">
                Permissions revoked or discontinued
              </span>
            </div>

            {/* Tracker Signatures */}
            <div className="p-4 rounded-xl bg-[#12121c] border border-amber-900/30">
              <span className="text-xs text-amber-400 font-mono block">Tracker Diff</span>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xl font-bold text-amber-300 font-mono">
                  +{comparison.new_trackers.length}
                </span>
                <span className="text-xs text-slate-500 font-mono">/</span>
                <span className="text-xl font-bold text-emerald-300 font-mono">
                  -{comparison.removed_trackers.length}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block pt-1">
                {comparison.retained_trackers_count} retained SDK signatures
              </span>
            </div>
          </div>

          {/* Detailed Changes Groups */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Permission Delta List */}
            <div className="p-5 rounded-xl bg-[#12121c] border border-purple-950/40 space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-purple-300 font-semibold">
                Permission Changes
              </h3>
              {comparison.added_permissions.length === 0 && comparison.removed_permissions.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">No permissions were added or removed between these releases.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {comparison.added_permissions.map((p) => (
                    <div key={p.name} className="p-2.5 bg-red-950/20 border border-red-900/40 rounded flex items-center justify-between text-xs">
                      <div>
                        <span className="text-red-300 font-mono block">{p.name.replace("android.permission.", "")}</span>
                        <span className="text-[10px] text-slate-400">{p.details}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-900/80 text-red-200">ADDED</span>
                    </div>
                  ))}
                  {comparison.removed_permissions.map((p) => (
                    <div key={p.name} className="p-2.5 bg-emerald-950/20 border border-emerald-900/40 rounded flex items-center justify-between text-xs">
                      <div>
                        <span className="text-emerald-300 font-mono block">{p.name.replace("android.permission.", "")}</span>
                        <span className="text-[10px] text-slate-400">{p.details}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-200">REMOVED</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tracker Signatures Delta */}
            <div className="p-5 rounded-xl bg-[#12121c] border border-purple-950/40 space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-semibold">
                Tracker Signature Changes
              </h3>
              {comparison.new_trackers.length === 0 && comparison.removed_trackers.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">No tracker signature additions or removals detected.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {comparison.new_trackers.map((t) => (
                    <div key={t.tracker_id} className="p-2.5 bg-amber-950/20 border border-amber-900/40 rounded flex items-center justify-between text-xs">
                      <div>
                        <span className="text-amber-300 font-semibold block">{t.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{t.category}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-900/80 text-amber-200">NEW MATCH</span>
                    </div>
                  ))}
                  {comparison.removed_trackers.map((t) => (
                    <div key={t.tracker_id} className="p-2.5 bg-emerald-950/20 border border-emerald-900/40 rounded flex items-center justify-between text-xs">
                      <div>
                        <span className="text-emerald-300 font-semibold block">{t.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{t.category}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-200">DISCONTINUED</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
