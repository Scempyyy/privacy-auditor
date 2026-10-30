"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  IconCertificate,
  IconCheck,
  IconAlertTriangle,
  IconShieldCheck,
  IconDownload,
  IconPrinter,
  IconCopy,
  IconUpload,
  IconKey,
  IconQrcode,
  IconArrowRight,
  IconFileText,
} from "@tabler/icons-react";
import {
  AnalysisReport,
  PrivacyPassport,
  PassportVerifyResponse,
  verifyPassportApi,
} from "@/lib/api";
import { getLatestScan } from "@/lib/history";

export default function PrivacyPassportPage() {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [passport, setPassport] = useState<PrivacyPassport | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [verifyResult, setVerifyResult] = useState<PassportVerifyResponse | null>(null);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const latest = getLatestScan();
    if (latest) {
      setReport(latest);
      if (latest.passport) {
        setPassport(latest.passport);
      }
    }
  }, []);

  function copyText(text: string, type: "hash" | "id") {
    navigator.clipboard.writeText(text);
    if (type === "hash") {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  }

  function downloadPassportJson() {
    if (!passport) return;
    const blob = new Blob([JSON.stringify(passport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${passport.passport_id}-${passport.payload.package_name}-passport.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    window.print();
  }

  async function handleVerifyFile(file: File) {
    setVerifyError("");
    setVerifyResult(null);
    setVerifyBusy(true);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as PrivacyPassport;
      if (!parsed.payload || !parsed.canonical_payload_sha256) {
        throw new Error("Invalid passport structure: missing payload or digest.");
      }
      const res = await verifyPassportApi(parsed);
      setVerifyResult(res);
    } catch (err: any) {
      setVerifyError(err?.message || "Failed to parse or verify passport file.");
    } finally {
      setVerifyBusy(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 print:py-0 print:px-0">
      {/* Header (hidden in print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-purple-950/40 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-widest">
            <IconCertificate size={15} /> Privacy Passport • Cryptographic Audit
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
            Verifiable Audit Certificate
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Each completed audit issues an Ed25519 digitally signed, canonicalized audit passport that can be exported, printed, and independently verified without uploading the APK binary.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-white flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <IconUpload size={14} /> Verify External Passport
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleVerifyFile(e.target.files[0]);
            }}
          />
        </div>
      </div>

      {/* Verification Feedback Banner */}
      {verifyResult && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs font-mono print:hidden ${
            verifyResult.is_valid && verifyResult.trusted_signer
              ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-200"
              : verifyResult.is_valid
              ? "bg-blue-950/40 border-blue-800/60 text-blue-200"
              : "bg-red-950/40 border-red-800/60 text-red-200"
          }`}
        >
          {verifyResult.is_valid ? (
            <IconCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <IconAlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <span className="font-bold block">
              {verifyResult.is_valid ? "Verification Passed" : "Verification Failed"}
            </span>
            <p className="font-sans text-[11px] leading-relaxed">{verifyResult.message}</p>
            {verifyResult.fingerprint && (
              <span className="text-[10px] text-slate-400 block">
                Signer Fingerprint: {verifyResult.fingerprint}
              </span>
            )}
          </div>
        </div>
      )}

      {verifyError && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs font-mono flex items-center gap-2 print:hidden">
          <IconAlertTriangle size={16} className="text-red-400 shrink-0" />
          <span>{verifyError}</span>
        </div>
      )}

      {!passport ? (
        <div className="text-center py-16 bg-[#101018] border border-purple-900/30 rounded-xl space-y-4 print:hidden">
          <IconFileText size={48} className="mx-auto text-purple-400/60" />
          <h2 className="text-lg font-semibold text-white">No Privacy Passport Generated</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Scan an APK in the scanner to produce a cryptographically signed Privacy Passport certificate.
          </p>
          <div className="pt-2">
            <Link href="/scanner" className="button-primary inline-flex items-center gap-2 text-sm">
              Run Scan to Issue Passport <IconArrowRight size={16} />
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Certificate Action Toolbar (hidden in print) */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#12121c] border border-purple-900/40 rounded-xl print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-purple-400">Passport ID:</span>
              <code className="text-xs font-mono text-white bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/50">
                {passport.passport_id}
              </code>
              <button
                onClick={() => copyText(passport.passport_id, "id")}
                className="text-xs text-slate-400 hover:text-white"
                title="Copy Passport ID"
              >
                {copiedId ? <IconCheck size={14} className="text-emerald-400" /> : <IconCopy size={14} />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadPassportJson}
                className="px-3 py-1.5 rounded bg-purple-900/60 hover:bg-purple-800/80 text-xs text-white font-mono flex items-center gap-1.5 transition-colors"
              >
                <IconDownload size={14} /> Download JSON
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-white font-mono flex items-center gap-1.5 transition-colors"
              >
                <IconPrinter size={14} /> Print / Export PDF
              </button>
            </div>
          </div>

          {/* Official Privacy Passport Document Card */}
          <div className="bg-[#0e0e17] border-2 border-purple-800/50 rounded-2xl p-8 space-y-6 shadow-2xl shadow-purple-950/30 print:border print:bg-white print:text-black print:shadow-none">
            {/* Passport Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-purple-900/40 print:border-black/20 pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse print:hidden" />
                  <span className="text-xs font-mono text-purple-400 print:text-black uppercase tracking-widest font-bold">
                    Official Privacy Audit Passport
                  </span>
                </div>
                <h2 className="text-3xl font-extrabold text-white print:text-black font-mono tracking-tight">
                  {passport.payload.app_name || passport.payload.package_name}
                </h2>
                <div className="text-xs font-mono text-slate-400 print:text-slate-700 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Package: {passport.payload.package_name}</span>
                  <span>Version: v{passport.payload.version_name || "1.0"} ({passport.payload.version_code || 1})</span>
                  <span>Target SDK: API {passport.payload.target_sdk || "N/A"}</span>
                </div>
              </div>

              {/* QR and Score Badge */}
              <div className="flex items-center gap-4 self-end sm:self-auto">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 print:text-slate-700 font-mono block">PRIVACY SCORE</span>
                  <div className="text-4xl font-extrabold font-mono text-white print:text-black">
                    {passport.payload.score}
                    <span className="text-sm font-normal text-slate-500 print:text-slate-700">/100</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-purple-300 print:text-purple-800">
                    Grade: {passport.payload.grade}
                  </span>
                </div>
                {passport.qr_png_base64 && (
                  <div className="bg-white p-1 rounded-lg border border-purple-900/50 print:border-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={passport.qr_png_base64}
                      alt="Privacy Passport QR Integrity Reference"
                      className="w-20 h-20"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Findings Matrix Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
              <div className="p-3.5 rounded-lg bg-[#141420] print:bg-slate-100 border border-purple-950/40 print:border-slate-300">
                <span className="text-[11px] text-slate-400 print:text-slate-600 font-mono block">Permissions Declared</span>
                <span className="text-xl font-bold text-white print:text-black font-mono mt-1 block">
                  {passport.payload.permissions.length}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-[#141420] print:bg-slate-100 border border-purple-950/40 print:border-slate-300">
                <span className="text-[11px] text-slate-400 print:text-slate-600 font-mono block">Trackers Detected</span>
                <span className="text-xl font-bold text-white print:text-black font-mono mt-1 block">
                  {passport.payload.trackers.length}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-[#141420] print:bg-slate-100 border border-purple-950/40 print:border-slate-300">
                <span className="text-[11px] text-slate-400 print:text-slate-600 font-mono block">Security Findings</span>
                <span className="text-xl font-bold text-white print:text-black font-mono mt-1 block">
                  {passport.payload.security_findings.length}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-[#141420] print:bg-slate-100 border border-purple-950/40 print:border-slate-300">
                <span className="text-[11px] text-slate-400 print:text-slate-600 font-mono block">X-Ray Bytecode Matches</span>
                <span className="text-xl font-bold text-white print:text-black font-mono mt-1 block">
                  {passport.payload.xray_summary?.with_references ?? 0}
                </span>
              </div>
            </div>

            {/* Cryptographic Integrity Section */}
            <div className="p-4 rounded-xl bg-[#0a0a10] print:bg-slate-50 border border-purple-900/30 print:border-slate-300 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-purple-400 print:text-purple-900 font-bold flex items-center gap-1.5">
                  <IconKey size={15} /> Cryptographic Integrity Proof
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    passport.is_signed
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800 print:bg-emerald-100 print:text-emerald-900"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {passport.is_signed ? "Ed25519 Signed" : "Hash-Only Digest"}
                </span>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-400 print:text-slate-700">
                <div className="flex items-center justify-between gap-2">
                  <span>Canonical Payload SHA-256:</span>
                  <div className="flex items-center gap-1.5">
                    <code className="text-slate-200 print:text-black bg-purple-950/40 print:bg-slate-200 px-1.5 py-0.5 rounded truncate max-w-xs md:max-w-md">
                      {passport.canonical_payload_sha256}
                    </code>
                    <button
                      onClick={() => copyText(passport.canonical_payload_sha256, "hash")}
                      className="text-slate-400 hover:text-white print:hidden"
                      title="Copy SHA-256"
                    >
                      {copiedHash ? <IconCheck size={13} className="text-emerald-400" /> : <IconCopy size={13} />}
                    </button>
                  </div>
                </div>

                {passport.public_key_fingerprint && (
                  <div className="flex items-center justify-between gap-2">
                    <span>Auditor Public Key Fingerprint:</span>
                    <code className="text-slate-300 print:text-black truncate max-w-xs md:max-w-md">
                      {passport.public_key_fingerprint}
                    </code>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <span>Issued At (UTC):</span>
                  <span className="text-slate-300 print:text-black">{passport.issued_at_utc}</span>
                </div>
              </div>
            </div>

            {/* Methodology & Limitations Footer */}
            <div className="text-[10px] text-slate-500 print:text-slate-600 font-sans leading-relaxed border-t border-purple-950/40 print:border-slate-300 pt-4 space-y-1">
              <p>
                <strong>Audit Framework:</strong> Engine {passport.payload.analyzer_version} • Methodology {passport.payload.methodology_version} • Commit {passport.payload.commit_identifier || "1965dbd"}.
              </p>
              <p>
                <strong>Limitations Notice:</strong> This audit report reflects offline static analysis of compiled APK bytecode and manifest declarations. It does not certify absence of malware or runtime safety. Cryptographic signatures verify report integrity and origin, not third-party compliance.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
