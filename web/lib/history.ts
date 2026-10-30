/**
 * Scan history management in browser localStorage.
 */
import { AnalysisReport, DEMO_REPORT } from "./api";

const STORAGE_KEY = "android_privacy_auditor_scan_history";
const CURRENT_REPORT_KEY = "android_privacy_auditor_active_report";

export function saveScanToHistory(report: AnalysisReport): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CURRENT_REPORT_KEY, JSON.stringify(report));
    if (report.is_demo) return; // Don't persist demo scans into permanent real history

    const existingJson = localStorage.getItem(STORAGE_KEY);
    const existing: AnalysisReport[] = existingJson ? JSON.parse(existingJson) : [];
    
    // Deduplicate by scan_id
    const updated = [report, ...existing.filter((s) => s.scan_id !== report.scan_id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 50)));
  } catch (err) {
    console.warn("Failed to persist scan history:", err);
  }
}

export function getScanHistory(): AnalysisReport[] {
  if (typeof window === "undefined") return [];
  try {
    const existingJson = localStorage.getItem(STORAGE_KEY);
    return existingJson ? JSON.parse(existingJson) : [];
  } catch {
    return [];
  }
}

export function getActiveReport(): AnalysisReport | null {
  if (typeof window === "undefined") return null;
  try {
    const json = sessionStorage.getItem(CURRENT_REPORT_KEY);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

export function getScanById(scanId: string): AnalysisReport | null {
  if (scanId === "demo" || scanId === DEMO_REPORT.scan_id) {
    return DEMO_REPORT;
  }
  const history = getScanHistory();
  return history.find((s) => s.scan_id === scanId) || null;
}

export function getLatestScan(): AnalysisReport | null {
  const active = getActiveReport();
  if (active) return active;
  const history = getScanHistory();
  return history[0] || DEMO_REPORT;
}

