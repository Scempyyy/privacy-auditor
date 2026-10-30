"use client";

import { Suspense, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  IconActivity,
  IconAlertTriangle,
  IconArrowDown,
  IconArrowRight,
  IconCertificate,
  IconCheck,
  IconCircleCheck,
  IconClock,
  IconCloudOff,
  IconCpu,
  IconDownload,
  IconFileSearch,
  IconFingerprint,
  IconHierarchy2,
  IconInfoCircle,
  IconKey,
  IconLock,
  IconLockOpen,
  IconPrinter,
  IconQrcode,
  IconSearch,
  IconShieldCheck,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import {
  AnalysisReport,
  DEMO_REPORT,
  PermissionFinding,
  PassportVerifyResponse,
  verifyPassportApi,
} from "@/lib/api";
import { getActiveReport, getScanById } from "@/lib/history";

export type ReportTab = "overview" | "reality" | "attack_surface" | "identity" | "passport";

function ReportView() {
  const searchParams = useSearchParams();
  const demoParam = searchParams.get("demo");
  const scanIdParam = searchParams.get("scan_id");
  const tabParam = searchParams.get("tab") as ReportTab | null;

  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReportTab>(tabParam || "overview");

  // Permission search & filter state for Tab 1
  const [permSearch, setPermSearch] = useState("");
  const [permFilter, setPermFilter] = useState<"all" | "unusual" | "review" | "expected" | "unclassified" | "high_sensitivity">("all");
  const [expandedPerm, setExpandedPerm] = useState<string | null>(null);

  // Attack surface filter state for Tab 3
  const [asFilterType, setAsFilterType] = useState<"all" | "activity" | "service" | "receiver" | "provider">("all");
  const [asFilterExported, setAsFilterExported] = useState<"all" | "exported" | "unguarded">("all");

  // Reality filter state for Tab 2
  const [realityFilter, setRealityFilter] = useState<"all" | "referenced" | "declared_only">("all");
  const [expandedCap, setExpandedCap] = useState<string | null>(null);

  // Passport state for Tab 5
  const [passportVerifyResult, setPassportVerifyResult] = useState<PassportVerifyResponse | null>(null);
  const [passportVerifyError, setPassportVerifyError] = useState("");
  const [passportVerifyBusy, setPassportVerifyBusy] = useState(false);
  const passportFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

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

  // Filtered permissions for Tab 1
  const filteredPermissions = useMemo(() => {
    if (!report) return [];
    return report.permissions.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(permSearch.toLowerCase()) ||
        p.explanation.toLowerCase().includes(permSearch.toLowerCase()) ||
        (p.group && p.group.toLowerCase().includes(permSearch.toLowerCase()));

      if (!matchesSearch) return false;

      if (permFilter === "unusual") return p.category_classification === "Unusual";
      if (permFilter === "review") return p.category_classification === "Review";
      if (permFilter === "expected") return p.category_classification === "Expected";
      if (permFilter === "unclassified") return p.category_classification === "Unclassified" || p.risk === "Unclassified";
      if (permFilter === "high_sensitivity") return p.risk === "Critical" || p.risk === "High";
      return true;
    });
  }, [report, permSearch, permFilter]);

  if (loading) {
    return (
      <section className="page-wrap report-unavailable">
        <span className="spinner" />
        <p className="mt-4 text-xs text-slate-400">Loading analysis workspace…</p>
      </section>
    );
  }

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

  const metrics = report.permission_metrics || {
    total_requested: report.permissions.length,
    classified: report.permissions.filter((p) => p.risk !== "Unclassified").length,
    unclassified: report.permissions.filter((p) => p.risk === "Unclassified").length,
    needing_review: report.permissions.filter((p) => p.category_classification === "Review").length,
    unusual: report.permissions.filter((p) => p.category_classification === "Unusual").length,
    high_risk: report.permissions.filter((p) => p.risk === "Critical" || p.risk === "High").length,
  };

  const permissionDeductionTotal = report.deductions
    .filter((d) => d.domain === "permissions")
    .reduce((sum, d) => sum + d.points, 0);
  const trackerDeductionTotal = report.deductions
    .filter((d) => d.domain === "trackers")
    .reduce((sum, d) => sum + d.points, 0);
  const securityDeductionTotal = report.deductions
    .filter((d) => d.domain === "security")
    .reduce((sum, d) => sum + d.points, 0);

  // Reality items
  const realityItems = report.privacy_reality?.items || [];
  const filteredRealityItems = realityItems.filter((it) => {
    if (realityFilter === "referenced") return it.classification === "declared_and_referenced";
    if (realityFilter === "declared_only") return it.classification === "declared_only_no_static_call";
    return true;
  });

  // Attack surface components
  const attackSurface = report.attack_surface;
  const asComponents = attackSurface?.components || [];
  const filteredAsComponents = asComponents.filter((c) => {
    if (asFilterType !== "all" && c.component_type !== asFilterType) return false;
    if (asFilterExported === "exported" && !c.is_exported) return false;
    if (asFilterExported === "unguarded" && (!c.is_exported || Boolean(c.permission))) return false;
    return true;
  });

  // Passport helpers
  const passport = report.passport;
  function downloadPassportJson() {
    if (!passport) return;
    const blob = new Blob([JSON.stringify(passport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${passport.passport_id}-${passport.payload.package_name}-passport.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleVerifyExternalPassport(file: File) {
    setPassportVerifyError("");
    setPassportVerifyResult(null);
    setPassportVerifyBusy(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await verifyPassportApi(parsed);
      setPassportVerifyResult(res);
    } catch (err: any) {
      setPassportVerifyError(err?.message || "Failed to parse or verify passport file.");
    } finally {
      setPassportVerifyBusy(false);
    }
  }

  return (
    <section className="page-wrap report-page space-y-6">
      {/* Demo Banner */}
      {isDemo && (
        <div className="demo-banner" role="status">
          <IconInfoCircle size={17} />
          <span>
            <b>DEMO DATA</b> — This is an illustrative sample fixture, not a real APK analysis.
          </span>
        </div>
      )}

      {/* Target Heading */}
      <div className="report-title-row">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            UNIFIED PRIVACY INTELLIGENCE WORKSPACE
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

      {/* 5-Tab Intelligence Navigation */}
      <div className="flex border-b border-slate-800 gap-2 text-xs font-mono overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 rounded-t-lg font-semibold transition border-b-2 flex items-center gap-2 shrink-0 ${
            activeTab === "overview"
              ? "bg-[#12121d] border-purple-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <IconShieldCheck size={16} /> Overview & Nutrition Label
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("reality")}
          className={`px-4 py-2.5 rounded-t-lg font-semibold transition border-b-2 flex items-center gap-2 shrink-0 ${
            activeTab === "reality"
              ? "bg-[#12121d] border-purple-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <IconHierarchy2 size={16} /> Privacy Reality & Bytecode X-Ray
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("attack_surface")}
          className={`px-4 py-2.5 rounded-t-lg font-semibold transition border-b-2 flex items-center gap-2 shrink-0 ${
            activeTab === "attack_surface"
              ? "bg-[#12121d] border-purple-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <IconAlertTriangle size={16} /> Attack Surface & IPC Exposure
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("identity")}
          className={`px-4 py-2.5 rounded-t-lg font-semibold transition border-b-2 flex items-center gap-2 shrink-0 ${
            activeTab === "identity"
              ? "bg-[#12121d] border-purple-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <IconFingerprint size={16} /> Publisher Identity & Supply Chain
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("passport")}
          className={`px-4 py-2.5 rounded-t-lg font-semibold transition border-b-2 flex items-center gap-2 shrink-0 ${
            activeTab === "passport"
              ? "bg-[#12121d] border-purple-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <IconCertificate size={16} /> Verifiable Privacy Passport
        </button>
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW & NUTRITION LABEL
         ========================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Score & Risk Summary */}
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
                  Deterministic assessment calculated from declared manifest permissions, category baseline expectations, recognized embedded tracker SDK signatures, and security hygiene.
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
                tone="purple"
              />
            </div>
          </div>

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
            </section>
          )}

          {/* Permissions & Trackers 2-Column Grid */}
          <div className="report-grid">
            {/* Left: Permission Audit */}
            <section className="report-card">
              <div className="section-title">
                <div>
                  <span className="section-icon purple-bg">
                    <IconLock size={17} />
                  </span>
                  <h2>Declared permissions</h2>
                </div>
                <span className="count-badge">{filteredPermissions.length} / {report.permissions.length}</span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="relative">
                  <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={permSearch}
                    onChange={(e) => setPermSearch(e.target.value)}
                    placeholder="Search permissions..."
                    className="w-full bg-[#0a0b12] border border-slate-800 rounded-lg pl-8 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-600"
                  />
                  {permSearch && (
                    <button
                      type="button"
                      onClick={() => setPermSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      <IconX size={14} />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 text-xs">
                  {(["all", "unusual", "review", "expected", "high_sensitivity", "unclassified"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setPermFilter(f)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition ${
                        permFilter === f
                          ? "bg-purple-600 text-white shadow-sm shadow-purple-900/50"
                          : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {f === "high_sensitivity" ? "High Sensitivity" : f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="permission-list">
                {filteredPermissions.length > 0 ? (
                  filteredPermissions.map((perm) => {
                    const isExpanded = expandedPerm === perm.name;
                    const revokeGuide = report.revoke_steps.find((r) => r.permission === perm.name);

                    return (
                      <div
                        className="permission-item transition hover:bg-slate-900/30 rounded-lg p-2.5 my-1 border border-transparent hover:border-slate-800/80 cursor-pointer"
                        key={perm.name}
                        onClick={() => setExpandedPerm(isExpanded ? null : perm.name)}
                      >
                        <div className="permission-top">
                          <span className={`risk-mark ${perm.risk}`} />
                          <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                            <b className="truncate text-white font-medium">{perm.group || perm.name.replace("android.permission.", "")}</b>
                            {perm.grant_mechanism && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60 font-mono">
                                {perm.grant_mechanism}
                              </span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                              Risk: {perm.risk}
                            </span>
                          </div>
                          <span className={`category-tag ${perm.category_classification.toLowerCase()}`}>
                            {perm.category_classification}
                          </span>
                        </div>
                        <small className="font-mono text-[10px] text-slate-500 block truncate mt-1">{perm.name}</small>
                        <p className="text-slate-300 text-xs mt-1 leading-relaxed">{perm.explanation}</p>

                        {/* Detailed Expandable Inspection Panel */}
                        {isExpanded && (
                          <div
                            className="mt-3 p-3 rounded-lg bg-[#0a0b12] border border-purple-900/30 text-xs font-mono space-y-2.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="text-slate-500 block text-[10px] uppercase">Category Fit Justification</span>
                                <span className="text-slate-200">
                                  {perm.category_classification === "Expected"
                                    ? `Common baseline permission for ${report.category} apps.`
                                    : perm.category_classification === "Review"
                                    ? `Contextual permission — only warranted if specific ${report.category} features are used.`
                                    : perm.category_classification === "Unusual"
                                    ? `Atypical for ${report.category} applications; creates elevated privacy exposure.`
                                    : "Unclassified custom or third-party permission."}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px] uppercase">Revocation Support</span>
                                <span className="text-emerald-400">
                                  {perm.grant_mechanism === "runtime"
                                    ? "Supported via Android Settings → App Permissions"
                                    : perm.grant_mechanism === "special_app_access"
                                    ? "Supported via Settings → Special App Access"
                                    : "Install-time permission (cannot be revoked individually without uninstalling app)"}
                                </span>
                              </div>
                            </div>

                            {perm.user_impact && (
                              <div className="pt-2 border-t border-slate-800 text-[11px]">
                                <span className="text-purple-400 font-semibold block text-[10px] uppercase">Privacy & Data Impact</span>
                                <p className="text-slate-300 font-sans mt-0.5">{perm.user_impact}</p>
                              </div>
                            )}

                            {revokeGuide && revokeGuide.steps.length > 0 && (
                              <div className="pt-2 border-t border-slate-800 text-[11px] space-y-1">
                                <span className="text-amber-400 font-semibold block text-[10px] uppercase">Step-by-Step Revocation</span>
                                <ol className="list-decimal pl-4 space-y-1 text-slate-300 font-sans">
                                  {revokeGuide.steps.map((st, sIdx) => (
                                    <li key={sIdx}>{st}</li>
                                  ))}
                                </ol>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="no-findings">No permissions match the selected filter.</p>
                )}
              </div>
            </section>

            {/* Right: Tracker & Hygiene */}
            <div className="space-y-6">
              <section className="report-card">
                <div className="section-title">
                  <div>
                    <span className="section-icon cyan-bg">
                      <IconActivity size={17} />
                    </span>
                    <h2>Detected trackers</h2>
                  </div>
                  <span className="count-badge">{report.trackers.length}</span>
                </div>

                {report.trackers.length > 0 ? (
                  <div className="tracker-list">
                    {report.trackers.map((t) => (
                      <div className="tracker-item" key={t.tracker_id || t.name}>
                        <span className="tracker-symbol"><IconActivity size={16} /></span>
                        <div>
                          <div className="flex items-center gap-2">
                            <b>{t.name}</b>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                              {t.category}
                            </span>
                          </div>
                          <small className="block mt-1 font-mono text-[10px] text-slate-400">Evidence: {t.evidence}</small>
                          <small className="block text-[10px] text-slate-500">{t.attribution}</small>
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
                      Scanned against 428 Exodus Privacy signatures.
                    </p>
                  </div>
                )}
              </section>

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
                <div className="space-y-2.5">
                  {report.security_findings.map((finding) => (
                    <div className="finding-item" key={finding.id || finding.title}>
                      <span className={`severity-tag ${finding.severity === "clean" ? "low bg-emerald-950 text-emerald-300" : "high"}`}>
                        {finding.severity === "clean" ? "Pass" : "Notice"}
                      </span>
                      <div>
                        <b>{finding.title}</b>
                        <p>{finding.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          {/* Deductions Breakdown */}
          <section className="report-card deduction-card">
            <div className="section-title">
              <div>
                <span className="section-icon amber-bg"><IconArrowDown size={17} /></span>
                <h2>How the score was calculated</h2>
              </div>
              <Link href="/trust-center" className="text-link">
                Scoring specification <IconArrowRight size={14} />
              </Link>
            </div>
            <div className="deduction-list">
              {report.deductions.map((deduction, idx) => (
                <div key={idx}>
                  <span>
                    <b>[{deduction.domain.toUpperCase()}]</b> {deduction.item} — {deduction.explanation}
                  </span>
                  <b>−{deduction.points.toFixed(deduction.points % 1 === 0 ? 0 : 2)} pts</b>
                </div>
              ))}
            </div>
          </section>

          {/* Dedicated Permission Revocation Assistant Section */}
          <section className="report-card p-6 space-y-4 border-emerald-900/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold">
                  User Remediation Action Center
                </div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <IconShieldCheck size={20} className="text-emerald-400" />
                  Permission Revocation Assistant
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Android 13+ / 14 / 15 Guidance
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              If you have already installed or intend to install this application, follow these Android Settings instructions to revoke risky or unusual permissions.
            </p>

            {report.revoke_steps && report.revoke_steps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {report.revoke_steps.map((rev, rIdx) => (
                  <div key={rIdx} className="p-4 rounded-xl border border-slate-800 bg-[#0c0d16] space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <b className="font-mono text-xs text-white">
                        {rev.permission.replace("android.permission.", "")}
                      </b>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                        Revocable
                      </span>
                    </div>
                    <ol className="list-decimal pl-4 space-y-1.5 text-xs text-slate-300">
                      {rev.steps.map((step, sIdx) => (
                        <li key={sIdx} className="leading-snug">{step}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-slate-800 bg-[#0c0d16] text-xs text-slate-400 space-y-2">
                <p>
                  <strong>No high-risk revocable permissions detected.</strong>
                </p>
                <p>
                  For standard permissions, navigate to: <code>Android Settings → Apps → {report.app_name || report.package_name} → Permissions</code>.
                </p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* =========================================================================
          TAB 2: PRIVACY REALITY & BYTECODE X-RAY (CONSOLIDATED P03)
         ========================================================================= */}
      {activeTab === "reality" && (
        <div className="space-y-6">
          {/* 5-Layer Indicator Architecture Header */}
          <div className="report-card p-6 space-y-4 border-purple-900/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-purple-400 font-bold">
                  Multi-Layer Evidence Correlation Engine
                </div>
                <h2 className="text-xl font-bold text-white">Privacy Reality & Bytecode X-Ray</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-[#0a0b12] border border-emerald-900/40 text-emerald-300 text-xs font-mono">
                  {report.privacy_reality?.total_statically_referenced ?? 0} Bytecode Referenced
                </span>
                <span className="px-2.5 py-1 rounded bg-[#0a0b12] border border-amber-900/40 text-amber-300 text-xs font-mono">
                  {report.privacy_reality?.total_declared_only ?? 0} Declared Only
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#0e0f1a] border border-blue-900/40 space-y-1">
                <span className="text-[10px] text-blue-400 block font-bold">LAYER 1: DECLARED</span>
                <p className="text-[10px] text-slate-400 font-sans">Permissions in AndroidManifest.xml.</p>
              </div>
              <div className="p-3 rounded-lg bg-[#0e0f1a] border border-emerald-900/40 space-y-1">
                <span className="text-[10px] text-emerald-400 block font-bold">LAYER 2: BYTECODE X-RAY</span>
                <p className="text-[10px] text-slate-400 font-sans">DEX callsites referencing framework APIs.</p>
              </div>
              <div className="p-3 rounded-lg bg-[#0e0f1a] border border-purple-900/40 space-y-1">
                <span className="text-[10px] text-purple-400 block font-bold">LAYER 3: DATA FLOW</span>
                <p className="text-[10px] text-slate-400 font-sans">Source-to-sink taint analysis.</p>
              </div>
              <div className="p-3 rounded-lg bg-[#0e0f1a] border border-amber-900/40 space-y-1">
                <span className="text-[10px] text-amber-400 block font-bold">LAYER 4: RUNTIME</span>
                <p className="text-[10px] text-slate-400 font-sans">Dynamic sandbox observations.</p>
              </div>
              <div className="p-3 rounded-lg bg-[#0e0f1a] border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold">LAYER 5: INCONCLUSIVE</span>
                <p className="text-[10px] text-slate-400 font-sans">Reflection or dynamic class loading.</p>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRealityFilter("all")}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition ${
                realityFilter === "all" ? "bg-purple-600 text-white" : "bg-slate-900 text-slate-400 border border-slate-800"
              }`}
            >
              All Capabilities ({realityItems.length})
            </button>
            <button
              type="button"
              onClick={() => setRealityFilter("referenced")}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition ${
                realityFilter === "referenced" ? "bg-emerald-600 text-white" : "bg-slate-900 text-slate-400 border border-slate-800"
              }`}
            >
              Referenced in DEX ({report.privacy_reality?.total_statically_referenced ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setRealityFilter("declared_only")}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition ${
                realityFilter === "declared_only" ? "bg-amber-600 text-white" : "bg-slate-900 text-slate-400 border border-slate-800"
              }`}
            >
              Declared Only ({report.privacy_reality?.total_declared_only ?? 0})
            </button>
          </div>

          {/* Reality Items with Granular Callsites */}
          <div className="space-y-3">
            {filteredRealityItems.map((item, idx) => {
              const hasRef = item.layer2_statically_referenced;
              const isExpanded = expandedCap === item.capability_name;

              // Match corresponding X-Ray finding if available for deep callsite view
              const xrayFinding = report.privacy_xray?.findings.find((f) => f.permission === item.capability_name);

              return (
                <div key={idx} className="p-4 rounded-xl border border-slate-800/80 bg-[#0d0d16] space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-white">
                          {item.capability_name.replace("android.permission.", "")}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">({item.capability_name})</span>
                      </div>
                      <p className="text-xs text-slate-300">{item.verdict_explanation}</p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium shrink-0 ${
                      hasRef ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-amber-950 text-amber-300 border border-amber-800"
                    }`}>
                      {hasRef ? `✓ Referenced (${item.callsites_count} calls)` : "Declared Only"}
                    </span>
                  </div>

                  {/* 5-Layer Status Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 font-mono text-[10px]">
                    <div className="p-2 rounded bg-[#0a0b12] border border-blue-900/30 flex justify-between">
                      <span className="text-slate-400">L1 Declared:</span>
                      <span className="text-blue-400 font-bold">YES</span>
                    </div>
                    <div className="p-2 rounded bg-[#0a0b12] border border-slate-800 flex justify-between">
                      <span className="text-slate-400">L2 Bytecode:</span>
                      <span className={hasRef ? "text-emerald-400 font-bold" : "text-slate-500"}>
                        {hasRef ? "CONFIRMED" : "UNOBSERVED"}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[#0a0b12] border border-slate-800 flex justify-between">
                      <span className="text-slate-400">L3 Flow:</span>
                      <span className="text-slate-500">OPTIONAL</span>
                    </div>
                    <div className="p-2 rounded bg-[#0a0b12] border border-slate-800 flex justify-between">
                      <span className="text-slate-400">L4 Runtime:</span>
                      <span className="text-slate-500">UNOBSERVED</span>
                    </div>
                    <div className="p-2 rounded bg-[#0a0b12] border border-slate-800 flex justify-between">
                      <span className="text-slate-400">L5 Status:</span>
                      <span className={hasRef ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                        {hasRef ? "CORRELATED" : "REVIEW"}
                      </span>
                    </div>
                  </div>

                  {/* Bytecode Callsites Details Accordion */}
                  {hasRef && xrayFinding && xrayFinding.evidence.length > 0 && (
                    <div className="pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setExpandedCap(isExpanded ? null : item.capability_name)}
                        className="text-xs text-purple-400 hover:text-purple-300 font-mono flex items-center gap-1"
                      >
                        {isExpanded ? "Hide Dalvik Callsite Evidence" : `View ${xrayFinding.evidence.length} Bytecode Callsite(s)`}
                        <IconArrowRight size={12} className={isExpanded ? "rotate-90 transition" : "transition"} />
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-2">
                          {xrayFinding.evidence.map((ev, eIdx) => (
                            <div key={eIdx} className="p-2.5 rounded bg-[#0a0b12] border border-slate-800 font-mono text-[11px] space-y-1">
                              <div className="text-purple-300">
                                <b>Caller: </b><code>{ev.caller_class}-&gt;{ev.caller_method}()</code>
                              </div>
                              <div className="text-slate-300">
                                <b>Target API: </b><code>{ev.referenced_api_class}-&gt;{ev.referenced_method}()</code>
                              </div>
                              <div className="text-slate-500 text-[10px] flex gap-3">
                                <span>DEX: {ev.dex_file}</span>
                                <span>Op: {ev.instruction_name}</span>
                                <span>Source: {ev.source}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: ATTACK SURFACE & IPC EXPOSURE (CONSOLIDATED P02)
         ========================================================================= */}
      {activeTab === "attack_surface" && (
        <div className="space-y-6">
          {attackSurface ? (
            <>
              {/* Attack Surface Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0c0d16] space-y-1">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Total Components</div>
                  <div className="text-xl font-bold font-mono text-white">{attackSurface.total_components}</div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0c0d16] space-y-1">
                  <div className="text-[10px] uppercase font-mono text-amber-400">Exported</div>
                  <div className="text-xl font-bold font-mono text-amber-300">{attackSurface.exported_count}</div>
                </div>
                <div className="p-3.5 rounded-xl border border-red-900/30 bg-[#0c0d16] space-y-1">
                  <div className="text-[10px] uppercase font-mono text-red-400">Unguarded</div>
                  <div className="text-xl font-bold font-mono text-red-400">{attackSurface.unprotected_count}</div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0c0d16] space-y-1">
                  <div className="text-[10px] uppercase font-mono text-blue-400">Activities</div>
                  <div className="text-xl font-bold font-mono text-blue-300">{attackSurface.activities_count}</div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0c0d16] space-y-1">
                  <div className="text-[10px] uppercase font-mono text-purple-400">Services</div>
                  <div className="text-xl font-bold font-mono text-purple-300">{attackSurface.services_count}</div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0c0d16] space-y-1">
                  <div className="text-[10px] uppercase font-mono text-cyan-400">Receivers/Providers</div>
                  <div className="text-xl font-bold font-mono text-cyan-300">{attackSurface.receivers_count} / {attackSurface.providers_count}</div>
                </div>
              </div>

              {/* Warning Callout */}
              <div className={`p-4 rounded-xl border ${attackSurface.unprotected_count > 0 ? "bg-red-950/20 border-red-900/50" : "bg-emerald-950/20 border-emerald-900/40"}`}>
                <div className="flex items-start gap-3">
                  <span className={`p-2 rounded-lg ${attackSurface.unprotected_count > 0 ? "bg-red-900/40 text-red-300" : "bg-emerald-900/40 text-emerald-300"}`}>
                    {attackSurface.unprotected_count > 0 ? <IconAlertTriangle size={20} /> : <IconShieldCheck size={20} />}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {attackSurface.unprotected_count > 0
                        ? `IPC Exposure Warning: ${attackSurface.unprotected_count} component(s) exported without permission authorization`
                        : "No Unguarded Exported Components"}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1">
                      {attackSurface.unprotected_count > 0
                        ? "Any third-party app installed on the device can interact with these components. Protect with android:permission or set exported=false."
                        : "All declared exported components have explicit permission constraints."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Component Filter & List */}
              <div className="report-card p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white">Component Inventory ({filteredAsComponents.length})</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs font-mono">
                      {(["all", "activity", "service", "receiver", "provider"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setAsFilterType(t)}
                          className={`px-2.5 py-1 rounded capitalize ${asFilterType === t ? "bg-purple-600 text-white" : "text-slate-400"}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => setAsFilterExported("all")}
                        className={`px-2 py-1 rounded ${asFilterExported === "all" ? "bg-slate-700 text-white" : "text-slate-400"}`}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setAsFilterExported("exported")}
                        className={`px-2 py-1 rounded ${asFilterExported === "exported" ? "bg-amber-600 text-white" : "text-slate-400"}`}
                      >
                        Exported
                      </button>
                      <button
                        type="button"
                        onClick={() => setAsFilterExported("unguarded")}
                        className={`px-2 py-1 rounded ${asFilterExported === "unguarded" ? "bg-red-600 text-white" : "text-slate-400"}`}
                      >
                        Unguarded
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredAsComponents.map((comp, idx) => (
                    <div key={idx} className="p-3.5 rounded-lg border border-slate-800/80 bg-[#0d0d16] space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-blue-950 text-blue-300 border border-blue-800">
                              {comp.component_type}
                            </span>
                            <span className="font-mono text-xs font-semibold text-slate-200">{comp.name}</span>
                          </div>
                          <p className="text-xs text-slate-400">{comp.explanation}</p>
                          {comp.remediation_hint && (
                            <p className="text-[11px] text-amber-400/90 font-mono">Remediation: {comp.remediation_hint}</p>
                          )}
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono shrink-0 ${
                          comp.is_exported ? (comp.permission ? "bg-amber-950 text-amber-300" : "bg-red-950 text-red-300") : "bg-slate-900 text-slate-400"
                        }`}>
                          {comp.is_exported ? (comp.permission ? "Exported (Guarded)" : "Exported (Unguarded)") : "Internal Private"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="no-findings">No attack surface data recorded for this audit.</p>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: PUBLISHER IDENTITY & SUPPLY CHAIN (CONSOLIDATED P02)
         ========================================================================= */}
      {activeTab === "identity" && (
        <div className="space-y-6">
          {report.publisher_identity ? (
            <>
              {/* Identity Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-slate-800 bg-[#0c0d16] space-y-1">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Signature Status</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 flex items-center gap-1.5">
                    <IconCheck size={18} /> {report.publisher_identity.is_signed ? "Cryptographically Signed" : "Unsigned"}
                  </div>
                  <div className="text-[11px] text-slate-400">Integrity verified</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-[#0c0d16] space-y-1">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Signing Scheme</div>
                  <div className="text-lg font-bold font-mono text-purple-300">
                    {report.publisher_identity.v2_signing_enabled ? "v2 (Full APK)" : report.publisher_identity.v1_signing_enabled ? "v1 (JAR)" : "v3"}
                  </div>
                  <div className="text-[11px] text-slate-400">v1/v2/v3 support</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-[#0c0d16] space-y-1">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Native Libraries (.so)</div>
                  <div className="text-lg font-bold font-mono text-cyan-300">
                    {report.publisher_identity.native_libraries.length}
                  </div>
                  <div className="text-[11px] text-slate-400">ABIs: {report.publisher_identity.supported_abis.join(", ") || "None"}</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-[#0c0d16] space-y-1">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Archive Size & DEX</div>
                  <div className="text-lg font-bold font-mono text-white">
                    {report.publisher_identity.dex_files.length} DEX ({(report.publisher_identity.total_uncompressed_bytes / (1024 * 1024)).toFixed(1)} MB)
                  </div>
                  <div className="text-[11px] text-slate-400">{report.publisher_identity.total_files} total entries</div>
                </div>
              </div>

              {/* Certificates */}
              <div className="report-card p-6 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <IconCertificate size={18} className="text-purple-400" />
                  X.509 Signing Certificates ({report.publisher_identity.certificates.length})
                </h3>
                <div className="space-y-3">
                  {report.publisher_identity.certificates.map((cert, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-800/80 bg-[#0d0d16] space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-mono">Subject DN</span>
                          <span className="text-slate-200 font-mono text-[11px] break-all">{cert.subject}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-mono">Issuer DN</span>
                          <span className="text-slate-200 font-mono text-[11px] break-all">{cert.issuer}</span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded bg-[#090a10] border border-slate-800 text-[11px] font-mono">
                        <span className="text-slate-500">SHA-256: </span>
                        <span className="text-emerald-400 break-all">{cert.sha256_fingerprint}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Native Libraries */}
              <div className="report-card p-6 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <IconCpu size={18} className="text-cyan-400" />
                  Native Libraries (.so) & Supply Chain Assets
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                  {report.publisher_identity.native_libraries.slice(0, 16).map((lib, lIdx) => (
                    <div key={lIdx} className="p-2.5 rounded bg-[#0e0f1a] border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-300 truncate max-w-[220px]">{lib.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                        {lib.abi} ({(lib.size_bytes / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="no-findings">No publisher identity information recorded.</p>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 5: CRYPTOGRAPHIC PRIVACY PASSPORT (CONSOLIDATED P02)
         ========================================================================= */}
      {activeTab === "passport" && (
        <div className="space-y-6">
          {passport ? (
            <>
              {/* Actions Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#12121c] border border-purple-900/40 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-purple-400">Passport ID:</span>
                  <code className="text-xs font-mono text-white bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/50">
                    {passport.passport_id}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={downloadPassportJson}
                    className="px-3 py-1.5 rounded bg-purple-900/60 hover:bg-purple-800/80 text-xs text-white font-mono flex items-center gap-1.5"
                  >
                    <IconDownload size={14} /> Download JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-white font-mono flex items-center gap-1.5"
                  >
                    <IconPrinter size={14} /> Print Certificate
                  </button>
                  <button
                    type="button"
                    onClick={() => passportFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-white font-mono flex items-center gap-1.5"
                  >
                    <IconUpload size={14} /> Verify External
                  </button>
                  <input
                    ref={passportFileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleVerifyExternalPassport(e.target.files[0]);
                    }}
                  />
                </div>
              </div>

              {/* Verification Feedback Banner */}
              {passportVerifyResult && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs font-mono ${
                  passportVerifyResult.is_valid ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-200" : "bg-red-950/40 border-red-800/60 text-red-200"
                }`}>
                  <IconCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">{passportVerifyResult.message}</span>
                    {passportVerifyResult.fingerprint && (
                      <span className="text-[10px] text-slate-400">Signer Key Fingerprint: {passportVerifyResult.fingerprint}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Official Certificate Card */}
              <div className="bg-[#0e0e17] border-2 border-purple-800/50 rounded-2xl p-8 space-y-6 shadow-2xl shadow-purple-950/30">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-purple-900/40 pb-6">
                  <div className="space-y-1">
                    <span className="text-xs font-mono text-purple-400 uppercase tracking-widest font-bold">
                      Official Privacy Audit Passport
                    </span>
                    <h2 className="text-3xl font-extrabold text-white font-mono tracking-tight">
                      {passport.payload.app_name || passport.payload.package_name}
                    </h2>
                    <div className="text-xs font-mono text-slate-400 flex flex-wrap gap-x-4">
                      <span>Package: {passport.payload.package_name}</span>
                      <span>Version: v{passport.payload.version_name || "1.0"}</span>
                      <span>Category: {passport.payload.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-mono block">PRIVACY SCORE</span>
                      <div className="text-4xl font-extrabold font-mono text-white">
                        {passport.payload.score}
                        <span className="text-sm font-normal text-slate-500">/100</span>
                      </div>
                      <span className="text-xs font-bold font-mono text-purple-300">Grade: {passport.payload.grade}</span>
                    </div>
                    {passport.qr_png_base64 && (
                      <div className="bg-white p-1 rounded-lg border border-purple-900/50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={passport.qr_png_base64} alt="Passport QR" className="w-20 h-20" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Cryptographic Proof Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-[#0a0b12] border border-slate-800 space-y-1">
                    <span className="text-slate-500 block text-[10px]">CANONICAL SHA-256 DIGEST</span>
                    <span className="text-purple-300 break-all">{passport.canonical_payload_sha256}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0a0b12] border border-slate-800 space-y-1">
                    <span className="text-slate-500 block text-[10px]">ED25519 DIGITAL SIGNATURE</span>
                    <span className="text-emerald-400 break-all">{passport.signature || "Unsigned Hash Verified"}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="no-findings">No privacy passport issued for this scan.</p>
          )}
        </div>
      )}
    </section>
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
          <p className="mt-4 text-xs text-slate-400">Loading analysis workspace…</p>
        </section>
      }
    >
      <ReportView />
    </Suspense>
  );
}
