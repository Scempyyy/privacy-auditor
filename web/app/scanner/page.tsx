"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconActivity,
  IconAlertTriangle,
  IconArrowRight,
  IconBrandAndroid,
  IconCheck,
  IconChevronDown,
  IconFileUpload,
  IconInfoCircle,
  IconLock,
  IconShieldCheck,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import {
  analyzeApk,
  checkApiHealth,
  AppCategory,
  CATEGORY_OPTIONS,
} from "@/lib/api";
import { saveScanToHistory } from "@/lib/history";

export default function ScannerPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<AppCategory>("social");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);

  // Check backend health on mount
  useEffect(() => {
    let mounted = true;
    checkApiHealth().then((status) => {
      if (mounted) setApiAvailable(status);
    });
    return () => {
      mounted = false;
    };
  }, []);

  function selectFile(candidate?: File | null) {
    setError("");
    if (!candidate) return;

    // Strict APK extension check
    if (!candidate.name.toLowerCase().endsWith(".apk")) {
      setFile(null);
      setError("Invalid file format. Please select an Android APK package ending in .apk.");
      return;
    }

    // Size limit check (100 MB max)
    const MAX_SIZE_MB = 100;
    if (candidate.size > MAX_SIZE_MB * 1024 * 1024) {
      setFile(null);
      setError(`File exceeds the maximum upload budget of ${MAX_SIZE_MB} MB.`);
      return;
    }

    setFile(candidate);
  }

  async function runAnalysis() {
    if (!file || busy) return;
    setBusy(true);
    setError("");

    try {
      const report = await analyzeApk(file, category);
      // Persist to session and local history
      saveScanToHistory(report);
      router.push("/report");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "The analysis request could not be completed.";
      setError(message);
      // Re-check health in background if failed
      checkApiHealth().then(setApiAvailable);
    } finally {
      setBusy(false);
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <section className="scanner-page page-wrap">
      <div className="page-heading">
        <div className="eyebrow">
          <span className="eyebrow-dot" />
          PRIVATE APK ANALYSIS
        </div>
        <h1>Scan an Android app</h1>
        <p>
          Upload an Android package (base.apk) to inspect its declared permissions, recognized
          tracker SDK signatures, and manifest security hygiene.
        </p>
      </div>

      <div className="scanner-layout">
        <div className="scanner-main">
          {/* Dropzone */}
          <div
            className={dragging ? "dropzone dragging" : "dropzone"}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              selectFile(e.dataTransfer.files?.[0]);
            }}
          >
            <input
              ref={inputRef}
              className="visually-hidden"
              type="file"
              accept=".apk,application/vnd.android.package-archive"
              onChange={(e) => selectFile(e.target.files?.[0])}
              aria-label="Choose APK file"
            />

            {file ? (
              <>
                <span className="upload-icon selected">
                  <IconBrandAndroid size={27} />
                </span>
                <h2>{file.name}</h2>
                <p>
                  {formatSize(file.size)} <span className="dot-separator">·</span> Ready to scan
                </p>
                <button
                  type="button"
                  className="remove-file"
                  onClick={() => {
                    setFile(null);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                  aria-label="Remove selected file"
                >
                  <IconX size={15} />
                </button>
              </>
            ) : (
              <>
                <span className="upload-icon">
                  <IconFileUpload size={26} />
                </span>
                <h2>Drop your APK here</h2>
                <p>or choose a package from your device</p>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => inputRef.current?.click()}
                >
                  <IconUpload size={16} /> Browse files
                </button>
                <span className="drop-hint">
                  APK files only <i /> Up to 100 MB budget
                </span>
              </>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="error-banner" role="alert">
              <IconAlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* App Category Selector */}
          <div className="form-field">
            <label htmlFor="app-category">App category</label>
            <div className="select-wrap">
              <select
                id="app-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as AppCategory)}
                disabled={busy}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <IconChevronDown size={17} />
            </div>
            <small>
              Used by the deterministic scoring engine to compare declared permissions against
              baseline expectations for this category.
            </small>
          </div>

          {/* Progress / Loading State */}
          {busy && (
            <div className="progress-state" role="status">
              <span className="spinner" />
              <span>
                <b>Running static analysis…</b>
                <small>Decompressing manifest, evaluating SDK targets, and matching DEX signatures.</small>
              </span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            className="button-primary scan-button"
            onClick={() => void runAnalysis()}
            disabled={!file || busy}
          >
            {busy ? (
              <>
                <span className="spinner small-spinner" /> Analyzing APK…
              </>
            ) : (
              <>
                Start privacy scan <IconArrowRight size={16} />
              </>
            )}
          </button>

          <div className="privacy-note">
            <IconLock size={15} />
            <span>
              Purely static analysis. The APK is parsed in memory/ephemeral storage and is never
              installed, launched, or executed.
            </span>
          </div>
        </div>

        {/* Sidebar Status & Guidance */}
        <aside className="scanner-aside">
          {/* Connection Card */}
          <div className="aside-card backend-card">
            <div className="aside-card-head">
              <span className="aside-icon">
                <IconActivity size={17} />
              </span>
              <b>Analyzer connection</b>
            </div>
            <div className="connection-status">
              <span
                className={
                  apiAvailable === true
                    ? "status-dot online"
                    : apiAvailable === false
                    ? "status-dot"
                    : "status-dot"
                }
              />
              {apiAvailable === null
                ? "Checking backend…"
                : apiAvailable
                ? "Backend online"
                : "Backend unavailable"}
            </div>
            <p>
              {apiAvailable
                ? "The analyzer health check responded successfully (GET /health)."
                : "FastAPI analyzer service is not responding. Ensure the backend is running at http://127.0.0.1:8000."}
            </p>
            <div className="endpoint-row">
              <code>POST /api/v1/analyze</code>
              <span>
                {apiAvailable === null ? "checking" : apiAvailable ? "ready" : "offline"}
              </span>
            </div>
          </div>

          {/* What you'll learn card */}
          <div className="aside-card">
            <div className="aside-card-head">
              <span className="aside-icon cyan-bg">
                <IconShieldCheck size={17} />
              </span>
              <b>Audit report findings</b>
            </div>
            <ul className="learn-list">
              <li>
                <IconCheck size={15} /> Declared permissions & category baselines
              </li>
              <li>
                <IconCheck size={15} /> Embedded third-party ad & tracker SDKs
              </li>
              <li>
                <IconCheck size={15} /> Security hygiene flags & target SDKs
              </li>
              <li>
                <IconCheck size={15} /> Deterministic 0–100 privacy score
              </li>
              <li>
                <IconCheck size={15} /> Step-by-step permission revocation guide
              </li>
            </ul>
          </div>

          <div className="aside-footnote">
            <IconInfoCircle size={15} />
            Static inspection cannot observe runtime network traffic after installation.
          </div>
        </aside>
      </div>
    </section>
  );
}
