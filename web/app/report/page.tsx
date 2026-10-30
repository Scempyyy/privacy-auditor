"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  IconActivity,
  IconAlertTriangle,
  IconArrowDown,
  IconArrowRight,
  IconCircleCheck,
  IconClock,
  IconCloudOff,
  IconFileSearch,
  IconInfoCircle,
  IconLock,
  IconShieldCheck,
} from "@tabler/icons-react";
import { AnalysisReport, DEMO_REPORT } from "@/lib/api";
import { getActiveReport, getScanById } from "@/lib/history";

function ReportView() {
  const searchParams = useSearchParams();
  const demoParam = searchParams.get("demo");
  const scanIdParam = searchParams.get("scan_id");

  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);

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
            PRIVACY ANALYSIS REPORT
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
            <span className={`grade-pill ${gradeTone}`}>{report.grade} privacy</span>
            <h2>
              {report.grade === "Good"
                ? "A clean, considered permission profile."
                : report.grade === "Fair"
                ? "Some permissions and tracker libraries warrant review."
                : "Elevated privacy risk with dangerous permission demands."}
            </h2>
            <p>
              Calculated using the deterministic scoring model based on declared permissions,
              category expectations, recognized tracker SDK signatures, and security hygiene.
            </p>
          </div>
        </div>

        {/* Risk Breakdown Summary */}
        <div className="risk-summary">
          <h3>Risk breakdown</h3>
          <RiskMeter
            label="Flagged permissions"
            value={
              report.permissions.filter(
                (p) => p.category_classification === "Unusual" || p.risk === "Critical"
              ).length
            }
            max={Math.max(report.permissions.length, 1)}
            tone="purple"
          />
          <RiskMeter
            label="Detected trackers"
            value={report.trackers.length}
            max={Math.max(report.trackers.length, 5)}
            tone="cyan"
          />
          <RiskMeter
            label="Security findings"
            value={report.security_findings.length}
            max={Math.max(report.security_findings.length, 3)}
            tone="amber"
          />
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
          label="Target SDK"
          value={`Min ${report.min_sdk ?? "—"} · Target ${report.target_sdk ?? "—"}`}
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
            <span className="count-badge">{report.permissions.length}</span>
          </div>
          <p className="section-subtitle">
            Permissions extracted from AndroidManifest.xml and evaluated against baseline expectations
            for the {report.category} category.
          </p>

          <div className="permission-list">
            {report.permissions.map((perm) => (
              <div className="permission-item" key={perm.name}>
                <div className="permission-top">
                  <span className={`risk-mark ${perm.risk}`} />
                  <b>{perm.group || perm.name.replace("android.permission.", "")}</b>
                  <span
                    className={`permission-state ${
                      perm.category_classification.toLowerCase()
                    }`}
                  >
                    {perm.category_classification}
                  </span>
                </div>
                <code>{perm.name}</code>
                <p>{perm.explanation}</p>
              </div>
            ))}
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
                      <b>{t.name}</b>
                      <small>
                        {t.category} · {t.attribution || t.evidence}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-findings">
                <IconCircleCheck size={16} /> No recognized tracker signatures detected.
              </p>
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
              <div>
                {report.security_findings.map((finding) => (
                  <div className="finding-item" key={finding.id || finding.title}>
                    <span className="severity-tag medium">Hygiene</span>
                    <div>
                      <b>{finding.title}</b>
                      <p>{finding.detail}</p>
                    </div>
                  </div>
                ))}
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
                <b>−{deduction.points} pts</b>
              </div>
            ))
          ) : (
            <div className="py-2 text-xs text-slate-400">
              No deductions applied. Starting baseline of 100 points maintained.
            </div>
          )}
        </div>
      </section>

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
            {report.revoke_steps.map((item, idx) => (
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
            ))}
          </div>
        </section>

        {/* Limitations */}
        <section className="report-card limitation-card">
          <div className="section-title">
            <div>
              <span className="section-icon">
                <IconInfoCircle size={17} />
              </span>
              <h2>Analysis limitations</h2>
            </div>
          </div>
          <ul>
            {report.limitations.map((limitation, idx) => (
              <li key={idx}>{limitation}</li>
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
