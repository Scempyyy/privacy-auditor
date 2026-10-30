"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  IconActivity,
  IconAlertTriangle,
  IconArrowDown,
  IconArrowRight,
  IconBugOff,
  IconCheck,
  IconCircleCheck,
  IconClock,
  IconCloudOff,
  IconFileSearch,
  IconHelpCircle,
  IconInfoCircle,
  IconLock,
  IconSearch,
  IconShieldCheck,
  IconX,
  IconCpu,
  IconCertificate,
} from "@tabler/icons-react";
import { AnalysisReport, DEMO_REPORT, PermissionFinding } from "@/lib/api";
import { getActiveReport, getScanById } from "@/lib/history";

function ReportView() {
  const searchParams = useSearchParams();
  const demoParam = searchParams.get("demo");
  const scanIdParam = searchParams.get("scan_id");

  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);

  // Permission search & filter state
  const [permSearch, setPermSearch] = useState("");
  const [permFilter, setPermFilter] = useState<"all" | "unusual" | "review" | "expected" | "unclassified">("all");

  useEffect(() => {
    if (demoParam === "true" || scanIdParam === "demo" || scanIdParam === DEMO_REPORT.scan_id) {
      setReport(DEMO_REPORT);
      setLoading(false);
      return;
    }

    if (scanIdParam) {
      const found = getScanById(scanIdParam);
      if (found) {
        setReport(found);
        setLoading(false);
        return;
      }
    }

    // Default to active session report
    const active = getActiveReport();
    setReport(active);
    setLoading(false);
  }, [demoParam, scanIdParam]);

  // Derived filtered permissions
  const filteredPermissions = useMemo(() => {
    if (!report) return [];
    return report.permissions.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(permSearch.toLowerCase()) ||
        p.explanation.toLowerCase().includes(permSearch.toLowerCase()) ||
        (p.group && p.group.toLowerCase().includes(permSearch.toLowerCase()));

      if (!matchesSearch) return false;

      if (permFilter === "unusual") {
        return p.category_classification === "Unusual";
      }
      if (permFilter === "review") {
        return p.category_classification === "Review";
      }
      if (permFilter === "expected") {
        return p.category_classification === "Expected";
      }
      if (permFilter === "unclassified") {
        return p.category_classification === "Unclassified" || p.risk === "Unclassified";
      }
      return true;
    });
  }, [report, permSearch, permFilter]);

  if (loading) {
    return (
      <section className="page-wrap report-unavailable">
        <span className="spinner" />
        <p className="mt-4 text-xs text-slate-400">Loading analysis report…</p>
      </section>
    );
  }

  // Empty state if no confirmed report
  if (!report) {
    return (
      <section className="page-wrap report-unavailable">
        <span className="empty-icon">
          <IconCloudOff size={22} />
        </span>
        <div className="eyebrow">
          <span className="eyebrow-dot" />
          NO REPORT AVAILABLE
        </div>
        <h1>Analysis required</h1>
        <p>
          There is no confirmed analysis report in this session. Run an APK scan with a connected
          backend, or view the clearly labelled demo sample report.
        </p>
        <div className="hero-actions">
          <Link href="/scanner" className="button-primary">
            <IconFileSearch size={16} /> Start a scan
          </Link>
          <Link href="/report?demo=true" className="button-quiet">
            View demo report <IconArrowRight size={15} />
          </Link>
        </div>
      </section>
    );
  }

  const isDemo = report.is_demo === true || report.scan_id === DEMO_REPORT.scan_id;
  const gradeTone = report.grade.toLowerCase();

  // Consistent metric numbers
  const metrics = report.permission_metrics || {
    total_requested: report.permissions.length,
    classified: report.permissions.filter((p) => p.risk !== "Unclassified").length,
    unclassified: report.permissions.filter((p) => p.risk === "Unclassified").length,
    needing_review: report.permissions.filter((p) => p.category_classification === "Review").length,
    unusual: report.permissions.filter((p) => p.category_classification === "Unusual").length,
    high_risk: report.permissions.filter((p) => p.risk === "Critical" || p.risk === "High").length,
  };

  // Domain deduction sums
  const permissionDeductionTotal = report.deductions
    .filter((d) => d.domain === "permissions")
    .reduce((sum, d) => sum + d.points, 0);
  const trackerDeductionTotal = report.deductions
    .filter((d) => d.domain === "trackers")
    .reduce((sum, d) => sum + d.points, 0);
  const securityDeductionTotal = report.deductions
    .filter((d) => d.domain === "security")
    .reduce((sum, d) => sum + d.points, 0);

  return (
    <section className="page-wrap report-page">
      {/* Prominent Demo Banner */}
      {isDemo && (
        <div className="demo-banner" role="status">
          <IconInfoCircle size={17} />
          <span>
            <b>DEMO DATA</b> — This is an illustrative sample fixture, not a real APK analysis.
          </span>
        </div>
      )}

      {/* Report Title Row */}
      <div className="report-title-row">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            STATIC PRIVACY & AUDIT REPORT
          </div>
          <h1>{report.app_name || report.package_name}</h1>
          <p className="package-line">
            <code>{report.package_name}</code>
            <span />
            Version {report.version_name || "N/A"} ({report.version_code ?? "N/A"})
            <span />
            Category: {report.category}
          </p>
        </div>
        <div className="report-date">
          <IconClock size={15} />
          {report.analyzed_at
            ? report.analyzed_at.includes("T")
              ? new Date(report.analyzed_at).toLocaleString()
              : report.analyzed_at
            : new Date().toLocaleString()}
        </div>
      </div>

      {/* Overview & Score Panel */}
      <div className="report-overview">
        <div className="score-panel">
          <div className={`score-ring ${gradeTone}`}>
            <div>
              <strong>{report.score}</strong>
              <small>OUT OF 100</small>
            </div>
          </div>
          <div className="score-copy">
            <span className={`grade-pill ${gradeTone}`}>{report.grade} Privacy Posture</span>
            <h2>
              {report.grade === "Good"
                ? "Considered, proportionate permission demands."
                : report.grade === "Fair"
                ? "Some permissions or tracker SDKs warrant user attention."
                : report.grade === "Risky"
                ? "Elevated privacy exposure with sensitive permissions or tracking."
                : "Excessive or disproportionate privacy demands."}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Heuristic privacy assessment calculated from declared manifest permissions, category baseline expectations, recognized embedded tracker SDK signatures, and security hygiene.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Permissions: −{permissionDeductionTotal.toFixed(1)} pts
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Trackers: −{trackerDeductionTotal.toFixed(1)} pts
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Security Hygiene: −{securityDeductionTotal.toFixed(1)} pts
              </span>
            </div>
          </div>
        </div>

        {/* Risk Breakdown Summary */}
        <div className="risk-summary">
          <h3>Inspection metrics</h3>
          <RiskMeter
            label="High-risk permissions"
            value={metrics.high_risk}
            max={Math.max(metrics.total_requested, 1)}
            tone="purple"
          />
          <RiskMeter
            label="Unusual for category"
            value={metrics.unusual}
            max={Math.max(metrics.total_requested, 1)}
            tone="purple"
          />
          <RiskMeter
            label="Detected tracker SDKs"
            value={report.trackers.length}
            max={Math.max(report.trackers.length, 5)}
            tone="cyan"
          />
          <RiskMeter
            label="Unclassified permissions"
            value={metrics.unclassified}
            max={Math.max(metrics.total_requested, 1)}
            tone="amber"
          />
        </div>
      </div>

      {/* Assessment Scope Notice (Including explicit Malware Scan Notice) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 my-4">
        <div className="p-3.5 rounded-lg border border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 mb-1">
            <IconLock size={15} /> 1. Permission Review
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            {metrics.classified} classified, {metrics.unclassified} unclassified, {metrics.unusual} unusual.
          </p>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
            <IconActivity size={15} /> 2. Tracker Detection
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            {report.trackers.length} matching signatures from 428 curated Exodus records.
          </p>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <IconShieldCheck size={15} /> 3. Security Hygiene
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Target SDK {report.target_sdk ?? "N/A"}, cleartext & debuggable verified.
          </p>
        </div>

        <div className="p-3.5 rounded-lg border border-amber-800/50 bg-amber-950/20">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <IconBugOff size={15} /> 4. Malware Status
          </div>
          <p className="text-[11px] text-amber-200/80 leading-snug font-medium">
            Malware scan not performed. Static auditor only; not an antivirus engine.
          </p>
        </div>
      </div>

      {/* Metadata Strip */}
      <div className="metadata-strip">
        <MetaItem label="Package Identifier" value={report.package_name} />
        <MetaItem
          label="Version"
          value={`${report.version_name || "N/A"} (${report.version_code ?? "N/A"})`}
        />
        <MetaItem
          label="SDK Levels"
          value={`Min ${report.min_sdk ?? "—"} · Target ${report.target_sdk ?? "—"}${
            report.compile_sdk ? ` · Compile ${report.compile_sdk}` : ""
          }`}
        />
        <MetaItem label="Scan ID" value={report.scan_id} />
      </div>

      {/* Main Grid: Permissions & Trackers/Security */}
      <div className="report-grid">
        {/* Declared Permissions Card */}
        <section className="report-card permission-card">
          <div className="section-title">
            <div>
              <span className="section-icon">
                <IconLock size={17} />
              </span>
              <h2>Declared permissions</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">
                {filteredPermissions.length} of {report.permissions.length} shown
              </span>
              <span className="count-badge">{report.permissions.length}</span>
            </div>
          </div>

          <p className="section-subtitle">
            Permissions declared in AndroidManifest.xml. Sensitivity depends on capability access, runtime vs install-time protection, and functional fit with the <b>{report.category}</b> category.
          </p>

          {/* Search & Filter Controls */}
          <div className="my-3 space-y-2">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
                <IconSearch size={14} />
              </span>
              <input
                type="text"
                placeholder="Search declared permissions..."
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
              />
              {permSearch && (
                <button
                  type="button"
                  onClick={() => setPermSearch("")}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-300"
                >
                  <IconX size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setPermFilter("all")}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  permFilter === "all"
                    ? "bg-purple-600/30 text-purple-300 border border-purple-500/50"
                    : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200"
                }`}
              >
                All ({report.permissions.length})
              </button>
              <button
                type="button"
                onClick={() => setPermFilter("unusual")}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  permFilter === "unusual"
                    ? "bg-purple-600/30 text-purple-300 border border-purple-500/50"
                    : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200"
                }`}
              >
                Unusual ({metrics.unusual})
              </button>
              <button
                type="button"
                onClick={() => setPermFilter("review")}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  permFilter === "review"
                    ? "bg-amber-600/30 text-amber-300 border border-amber-500/50"
                    : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200"
                }`}
              >
                Review ({metrics.needing_review})
              </button>
              <button
                type="button"
                onClick={() => setPermFilter("expected")}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  permFilter === "expected"
                    ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/50"
                    : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200"
                }`}
              >
                Expected ({report.permissions.filter((p) => p.category_classification === "Expected").length})
              </button>
              <button
                type="button"
                onClick={() => setPermFilter("unclassified")}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  permFilter === "unclassified"
                    ? "bg-slate-700/60 text-slate-200 border border-slate-600"
                    : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200"
                }`}
              >
                Unclassified ({metrics.unclassified})
              </button>
            </div>
          </div>

          <div className="permission-list">
            {filteredPermissions.length > 0 ? (
              filteredPermissions.map((perm) => {
                const isUnclass =
                  perm.category_classification === "Unclassified" ||
                  perm.risk === "Unclassified" ||
                  perm.risk === "Unknown";

                return (
                  <div className="permission-item" key={perm.name}>
                    <div className="permission-top">
                      <span className={`risk-mark ${isUnclass ? "Unclassified" : perm.risk}`} />
                      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                        <b className="truncate">
                          {perm.group || perm.name.replace("android.permission.", "")}
                        </b>
                        {perm.grant_mechanism === "runtime" && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60 font-mono">
                            runtime
                          </span>
                        )}
                        {perm.grant_mechanism === "special_app_access" && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 font-mono">
                            special app access
                          </span>
                        )}
                        {perm.grant_mechanism === "signature_restricted" && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950/80 text-red-300 border border-red-800/60 font-mono">
                            signature
                          </span>
                        )}
                        {perm.grant_mechanism === "install_time" && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60 font-mono">
                            install time
                          </span>
                        )}
                        {(perm.platform_protection_level || perm.protection_level) && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono" title="Platform Protection Level">
                            {perm.platform_protection_level || perm.protection_level}
                          </span>
                        )}
                      </div>
                      <span
                        className={`permission-state ${
                          isUnclass
                            ? "bg-slate-800/80 text-slate-300 border border-slate-700"
                            : perm.category_classification.toLowerCase()
                        }`}
                      >
                        {perm.category_classification}
                      </span>
                    </div>
                    <code>{perm.name}</code>
                    <p className="mt-1">{perm.explanation}</p>
                    {perm.user_impact && (
                      <p className="text-[11px] text-slate-400 mt-1 italic">
                        Impact: {perm.user_impact}
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                No permissions match the current search or filter criteria.
              </div>
            )}
          </div>
        </section>

        {/* Side Stack: Trackers & Security Hygiene */}
        <div className="report-side-stack">
          {/* Trackers */}
          <section className="report-card">
            <div className="section-title">
              <div>
                <span className="section-icon cyan-bg">
                  <IconActivity size={17} />
                </span>
                <h2>Tracker findings</h2>
              </div>
              <span className="count-badge">{report.trackers.length}</span>
            </div>

            {report.trackers.length > 0 ? (
              <div className="tracker-list">
                {report.trackers.map((t) => (
                  <div className="tracker-item" key={t.tracker_id || t.name}>
                    <span className="tracker-symbol">
                      <IconActivity size={16} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <b>{t.name}</b>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                          {t.category}
                        </span>
                      </div>
                      <small className="block mt-1 font-mono text-[10px] text-slate-400">
                        Evidence: {t.evidence}
                      </small>
                      <small className="block text-[10px] text-slate-500">
                        {t.attribution}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 p-3.5 rounded-lg border border-slate-800/80 bg-slate-900/40 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-medium mb-1">
                  <IconCircleCheck size={16} /> No curated tracker signatures matched
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  No signatures from the current curated database matched this APK. This does not prove the application has no tracking or telemetry. Database contains 428 curated tracker signatures from Exodus Privacy (updated Oct 30, 2026).
                </p>
              </div>
            )}
          </section>

          {/* Security Hygiene */}
          <section className="report-card">
            <div className="section-title">
              <div>
                <span className="section-icon amber-bg">
                  <IconAlertTriangle size={17} />
                </span>
                <h2>Security hygiene</h2>
              </div>
              <span className="count-badge">{report.security_findings.length}</span>
            </div>

            {report.security_findings.length > 0 ? (
              <div className="space-y-2.5">
                {report.security_findings.map((finding) => {
                  const isClean = finding.severity === "clean" || finding.status === "checked_clean";
                  const isWarn = finding.severity === "warning" || finding.status === "finding_detected";
                  
                  return (
                    <div className="finding-item" key={finding.id || finding.title}>
                      <span
                        className={`severity-tag ${
                          isClean ? "low bg-emerald-950 text-emerald-300 border-emerald-800/60" : isWarn ? "high" : "medium"
                        }`}
                      >
                        {isClean ? "Pass" : isWarn ? "Notice" : "Info"}
                      </span>
                      <div>
                        <b>{finding.title}</b>
                        <p>{finding.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="no-findings">
                <IconCircleCheck size={16} /> Manifest security settings follow standard defaults.
              </p>
            )}
          </section>
        </div>
      </div>

      {/* Deduction Breakdown Card */}
      <section className="report-card deduction-card">
        <div className="section-title">
          <div>
            <span className="section-icon amber-bg">
              <IconArrowDown size={17} />
            </span>
            <h2>How the score was calculated</h2>
          </div>
          <Link href="/methodology" className="text-link">
            Scoring model specification <IconArrowRight size={14} />
          </Link>
        </div>

        <div className="deduction-list">
          {report.deductions.length > 0 ? (
            report.deductions.map((deduction, idx) => (
              <div key={idx}>
                <span>
                  <b>[{deduction.domain.toUpperCase()}]</b> {deduction.item} —{" "}
                  {deduction.explanation}
                </span>
                <b>−{deduction.points.toFixed(deduction.points % 1 === 0 ? 0 : 2)} pts</b>
              </div>
            ))
          ) : (
            <div className="py-2 text-xs text-slate-400">
              No deductions applied. Starting baseline of 100 points maintained.
            </div>
          )}
        </div>
      </section>

      {/* Privacy Nutrition Label Card */}
      {report.nutrition_label && (
        <section className="report-card p-6 space-y-4 border-purple-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-purple-400 font-bold">
                Consumer Privacy Transparency
              </div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Privacy Nutrition Label
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                report.nutrition_label.grade === "A" || report.nutrition_label.grade === "B" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" :
                report.nutrition_label.grade === "C" ? "bg-amber-950 text-amber-300 border border-amber-800" :
                "bg-red-950 text-red-300 border border-red-800"
              }`}>
                Grade {report.nutrition_label.grade} ({report.nutrition_label.score}/100)
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono"
              >
                Print / Save PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {report.nutrition_label.sections.map((sec, sIdx) => (
              <div
                key={sIdx}
                className="p-3.5 rounded-lg border border-slate-800/80 bg-[#0c0d16] space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs text-white">{sec.title}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    sec.status === "not_detected" ? "bg-emerald-950 text-emerald-300" :
                    sec.status === "declared_capability" ? "bg-amber-950 text-amber-300" :
                    "bg-red-950 text-red-300"
                  }`}>
                    {sec.badge_label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{sec.details}</p>
                <p className="text-[10px] text-slate-500 italic leading-snug">{sec.consequences_summary}</p>
                {sec.suggested_action && (
                  <p className="text-[10px] text-purple-300/90 font-mono pt-1">
                    Action: {sec.suggested_action}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Standardized privacy disclosure generated deterministically from APK bytecode & manifest.</span>
            <Link href="/attack-surface" className="text-purple-400 hover:text-purple-300 font-mono flex items-center gap-1">
              Attack Surface Explorer <IconArrowRight size={13} />
            </Link>
          </div>
        </section>
      )}

      {/* Feature 1 & 3: Compact X-Ray & Passport Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Privacy X-Ray Section */}
        <section className="report-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-950/80 text-purple-400 border border-purple-800/40">
                <IconCpu size={18} />
              </span>
              <h2 className="text-sm font-bold text-white font-mono">Privacy X-Ray Evidence</h2>
            </div>
            <Link href="/xray" className="text-xs text-purple-400 hover:text-purple-300 font-mono flex items-center gap-1">
              Full X-Ray <IconArrowRight size={13} />
            </Link>
          </div>
          <p className="text-xs text-slate-400">
            Bytecode analysis inspected Dalvik classes for callsites associated with declared permissions.
          </p>
          <div className="flex items-center gap-3 font-mono text-xs pt-1">
            <span className="px-2.5 py-1 rounded bg-[#101018] border border-emerald-900/40 text-emerald-300">
              {report.privacy_xray?.permissions_with_references ?? 0} API reference(s) found
            </span>
            <span className="px-2.5 py-1 rounded bg-[#101018] border border-slate-800 text-slate-400">
              {report.privacy_xray?.permissions_no_reference_observed ?? 0} unobserved
            </span>
          </div>
        </section>

        {/* Privacy Passport Section */}
        <section className="report-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                <IconCertificate size={18} />
              </span>
              <h2 className="text-sm font-bold text-white font-mono">Verifiable Privacy Passport</h2>
            </div>
            <Link href="/passport" className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1">
              View Passport <IconArrowRight size={13} />
            </Link>
          </div>
          <p className="text-xs text-slate-400">
            Cryptographically signed audit certificate with canonical SHA-256 payload digest and QR reference.
          </p>
          <div className="flex items-center gap-3 font-mono text-xs pt-1">
            <span className="px-2.5 py-1 rounded bg-[#101018] border border-purple-900/40 text-purple-300">
              {report.passport?.is_signed ? "Ed25519 Signed" : "Hash Verified"}
            </span>
            <span className="text-slate-500 text-[11px] truncate max-w-[180px]">
              ID: {report.passport?.passport_id ?? "N/A"}
            </span>
          </div>
        </section>
      </div>

      {/* Bottom Grid: Revocation Steps & Limitations */}
      <div className="report-bottom-grid">
        {/* Permission Revocation Guidance */}
        <section className="report-card">
          <div className="section-title">
            <div>
              <span className="section-icon green-bg">
                <IconShieldCheck size={17} />
              </span>
              <h2>Permission remediation</h2>
            </div>
          </div>
          <p className="section-subtitle">
            Step-by-step guidance to revoke invasive permissions in Android device settings:
          </p>
          <div className="space-y-4">
            {report.revoke_steps.length > 0 ? (
              report.revoke_steps.map((item, idx) => (
                <div key={idx}>
                  <b className="text-[10px] text-slate-200 block mb-1">
                    {item.permission.replace("android.permission.", "")}
                  </b>
                  <ol className="revoke-list">
                    {item.steps.map((step, sIdx) => (
                      <li key={sIdx}>{step}</li>
                    ))}
                  </ol>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-2">
                No high-risk permissions requiring revocation steps were detected.
              </div>
            )}
          </div>
        </section>

        {/* Limitations */}
        <section className="report-card limitation-card">
          <div className="section-title">
            <div>
              <span className="section-icon">
                <IconInfoCircle size={17} />
              </span>
              <h2>Analysis limitations & disclaimers</h2>
            </div>
          </div>
          <ul className="space-y-2">
            {report.limitations.map((limitation, idx) => (
              <li key={idx} className="text-xs text-slate-400 leading-relaxed">
                {limitation}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <small>{label}</small>
      <b title={value}>{value}</b>
    </div>
  );
}

function RiskMeter({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: string;
}) {
  const percentage = Math.min((value / Math.max(max, 1)) * 100, 100);
  return (
    <div className="risk-meter">
      <div>
        <span>{label}</span>
        <b>{value}</b>
      </div>
      <span className="meter-track">
        <i className={tone} style={{ width: `${percentage}%` }} />
      </span>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <section className="page-wrap report-unavailable">
          <span className="spinner" />
          <p className="mt-4 text-xs text-slate-400">Loading analysis report…</p>
        </section>
      }
    >
      <ReportView />
    </Suspense>
  );
}
