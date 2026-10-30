"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconBrandAndroid,
  IconChevronDown,
  IconClock,
  IconFileSearch,
  IconFilter,
  IconInfoCircle,
  IconSearch,
  IconShieldCheck,
} from "@tabler/icons-react";
import { AnalysisReport, DEMO_REPORT } from "@/lib/api";
import { getScanHistory } from "@/lib/history";

export default function DashboardPage() {
  const router = useRouter();
  const [history, setHistory] = useState<AnalysisReport[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "real" | "demo">("all");

  useEffect(() => {
    setHistory(getScanHistory());
  }, []);

  // Compute summary metrics from real scans
  const realScansCount = history.length;
  const avgScore =
    realScansCount > 0
      ? Math.round(history.reduce((acc, s) => acc + s.score, 0) / realScansCount)
      : null;
  const lastAnalyzed = realScansCount > 0 && history[0].analyzed_at
    ? new Date(history[0].analyzed_at).toLocaleDateString()
    : null;

  // Search and filter logic
  const query = search.toLowerCase().trim();

  const filteredRealScans = history.filter((scan) => {
    if (filter === "demo") return false;
    const nameMatch = (scan.app_name || "").toLowerCase().includes(query);
    const pkgMatch = scan.package_name.toLowerCase().includes(query);
    return !query || nameMatch || pkgMatch;
  });

  const showDemo =
    (filter === "all" || filter === "demo") &&
    (!query ||
      DEMO_REPORT.app_name?.toLowerCase().includes(query) ||
      DEMO_REPORT.package_name.toLowerCase().includes(query));

  return (
    <section className="page-wrap dashboard-page">
      <div className="page-heading dashboard-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            YOUR ANALYSIS WORKSPACE
          </div>
          <h1>Scan history</h1>
          <p>Review previously audited APK packages and evaluate their privacy scores.</p>
        </div>
        <Link href="/scanner" className="button-primary">
          <IconFileSearch size={17} /> New scan <IconArrowRight size={15} />
        </Link>
      </div>

      {/* Summary Metrics */}
      <div className="summary-grid">
        <SummaryCard
          icon={<IconFileSearch size={18} />}
          label="Total scans"
          value={realScansCount > 0 ? String(realScansCount) : "—"}
          note={realScansCount > 0 ? "Analyzed packages" : "No real scans yet"}
        />
        <SummaryCard
          icon={<IconShieldCheck size={18} />}
          label="Average score"
          value={avgScore !== null ? `${avgScore} / 100` : "—"}
          note={avgScore !== null ? "Across audited apps" : "Scores appear after scan"}
        />
        <SummaryCard
          icon={<IconClock size={18} />}
          label="Last analyzed"
          value={lastAnalyzed || "—"}
          note={lastAnalyzed ? "Most recent audit" : "Ready for your first scan"}
        />
      </div>

      {/* History Card */}
      <div className="history-card">
        <div className="history-heading">
          <div>
            <h2>Recent scans</h2>
            <p>Audited APKs are recorded locally in your browser storage.</p>
          </div>
          <span className="demo-tag">
            <span /> DEMO AVAILABLE
          </span>
        </div>

        {/* Tools: Search & Filter */}
        <div className="history-tools">
          <label className="search-box">
            <IconSearch size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search apps or package IDs…"
              aria-label="Search scan history"
            />
          </label>
          <label className="filter-box">
            <IconFilter size={15} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as "all" | "real" | "demo")}
              aria-label="Filter scan history"
            >
              <option value="all">All scans</option>
              <option value="real">Real scans only</option>
              <option value="demo">Demo sample data</option>
            </select>
            <IconChevronDown size={14} />
          </label>
        </div>

        {/* Scan List Rows */}
        {filteredRealScans.length > 0 || showDemo ? (
          <div>
            {/* Real Scans */}
            {filteredRealScans.map((scan) => (
              <button
                type="button"
                className="history-row"
                key={scan.scan_id}
                onClick={() => router.push(`/report?scan_id=${scan.scan_id}`)}
              >
                <span className="app-avatar">
                  <IconBrandAndroid size={20} />
                </span>
                <span className="history-app">
                  <b>{scan.app_name || scan.package_name}</b>
                  <small>{scan.package_name}</small>
                </span>
                <span className="history-category">{scan.category}</span>
                <span className={`score-chip ${scan.grade.toLowerCase()}`}>
                  {scan.score} <small>/ 100</small>
                </span>
                <span className="history-grade">{scan.grade}</span>
                <IconArrowUpRight size={17} className="row-arrow" />
              </button>
            ))}

            {/* Demo Scan Fixture */}
            {showDemo && (
              <button
                type="button"
                className="history-row"
                onClick={() => router.push("/report?demo=true")}
              >
                <span className="app-avatar">
                  <IconBrandAndroid size={20} />
                </span>
                <span className="history-app">
                  <b>
                    {DEMO_REPORT.app_name}{" "}
                    <span className="demo-inline">DEMO DATA</span>
                  </b>
                  <small>{DEMO_REPORT.package_name}</small>
                </span>
                <span className="history-category">{DEMO_REPORT.category}</span>
                <span className={`score-chip ${DEMO_REPORT.grade.toLowerCase()}`}>
                  {DEMO_REPORT.score} <small>/ 100</small>
                </span>
                <span className="history-grade">{DEMO_REPORT.grade}</span>
                <IconArrowUpRight size={17} className="row-arrow" />
              </button>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">
              <IconFileSearch size={21} />
            </span>
            <h3>{search ? "No matching scans found" : "No scans to display"}</h3>
            <p>
              {search
                ? "Try searching for another app name or package identifier."
                : "Upload an APK to see genuine analysis results here."}
            </p>
            {!search && (
              <Link href="/scanner" className="text-link">
                Scan an APK package <IconArrowRight size={15} />
              </Link>
            )}
          </div>
        )}

        <div className="demo-disclaimer">
          <IconInfoCircle size={15} />
          The sample report is illustrative demo data. All user uploads remain local and private.
        </div>
      </div>
    </section>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="summary-card">
      <div className="summary-top">
        <span>{icon}</span>
        <small>{label}</small>
      </div>
      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  );
}
