"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import {
  IconArrowRight,
  IconCertificate,
  IconCheck,
  IconCloudOff,
  IconCpu,
  IconFileCheck,
  IconFingerprint,
  IconInfoCircle,
  IconKey,
  IconLock,
  IconServer,
  IconShieldCheck,
} from "@tabler/icons-react";
import { AnalysisReport, DEMO_REPORT, PublisherIdentityReport } from "@/lib/api";
import { getActiveReport } from "@/lib/history";

export default function PublisherIdentityPage() {
  return (
    <Suspense fallback={<div className="page-wrap"><p className="text-slate-400 text-xs">Loading Publisher Identity...</p></div>}>
      <PublisherIdentityView />
    </Suspense>
  );
}

function PublisherIdentityView() {
  const [report, setReport] = useState<AnalysisReport | null>(null);

  useEffect(() => {
    const active = getActiveReport();
    setReport(active || DEMO_REPORT);
  }, []);

  const identity: PublisherIdentityReport | undefined | null = report?.publisher_identity;

  return (
    <section className="page-wrap space-y-8">
      {/* Hero Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/40 text-blue-300 text-xs font-mono">
          <IconFingerprint size={14} /> Cryptographic APK Provenance & Supply Chain
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          APK Publisher Identity & Supply Chain Inspector
        </h1>
        <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
          Inspects APK signing certificates, cryptographic signature scheme versions (v1 JAR, v2 Full APK, v3 Key Rotation),
          native binary architectures (<code className="text-purple-300">.so</code> libraries), and internal asset distributions.
          A valid signature verifies binary integrity and developer certificate ownership.
        </p>
      </div>

      {!identity ? (
        <div className="report-card p-8 text-center space-y-4">
          <IconCloudOff size={32} className="mx-auto text-slate-500" />
          <h2 className="text-lg font-semibold text-white">No Publisher Identity Data Available</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Scan an APK to inspect its signing certificates and supply-chain assets, or inspect the demo report.
          </p>
          <Link href="/scanner" className="button-primary inline-flex items-center gap-2">
            <IconShieldCheck size={16} /> Scan an APK
          </Link>
        </div>
      ) : (
        <>
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-[#0c0d16] space-y-1">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Signature Status</div>
              <div className="text-xl font-bold font-mono text-emerald-400 flex items-center gap-2">
                <IconCheck size={20} /> {identity.is_signed ? "Cryptographically Signed" : "Unsigned"}
              </div>
              <div className="text-[11px] text-slate-400">Integrity verified</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-[#0c0d16] space-y-1">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Signing Schemes</div>
              <div className="text-xl font-bold font-mono text-purple-300 flex items-center gap-2">
                {identity.v2_signing_enabled ? "v2 (Full APK)" : identity.v1_signing_enabled ? "v1 (JAR)" : "v3"}
              </div>
              <div className="text-[11px] text-slate-400">
                v1: {identity.v1_signing_enabled ? "Yes" : "No"} • v2: {identity.v2_signing_enabled ? "Yes" : "No"} • v3: {identity.v3_signing_enabled ? "Yes" : "No"}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-[#0c0d16] space-y-1">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Native Libraries (.so)</div>
              <div className="text-xl font-bold font-mono text-cyan-300">
                {identity.native_libraries.length}
              </div>
              <div className="text-[11px] text-slate-400">ABIs: {identity.supported_abis.join(", ") || "None (Pure Java/Kotlin)"}</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-[#0c0d16] space-y-1">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">DEX Files & Size</div>
              <div className="text-xl font-bold font-mono text-white">
                {identity.dex_files.length} DEX ({(identity.total_uncompressed_bytes / (1024 * 1024)).toFixed(1)} MB)
              </div>
              <div className="text-[11px] text-slate-400">{identity.total_files} total archive entries</div>
            </div>
          </div>

          {/* Signing Certificates Card */}
          <div className="report-card p-6 space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <IconCertificate size={18} className="text-purple-400" />
                Signing Certificate Details ({identity.certificates.length})
              </h2>
              <p className="text-xs text-slate-400">
                Cryptographic certificates embedded in the APK signing block used to authenticate APK updates.
              </p>
            </div>

            <div className="space-y-4">
              {identity.certificates.map((cert, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-800/80 bg-[#0d0d16] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-200">
                      Certificate #{idx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 text-[10px] font-mono">
                      X.509
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-mono uppercase">Subject DN</span>
                      <span className="text-slate-200 font-mono text-[11px] break-all">{cert.subject}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-mono uppercase">Issuer DN</span>
                      <span className="text-slate-200 font-mono text-[11px] break-all">{cert.issuer}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#090a10] border border-slate-800/80 font-mono text-[11px] space-y-1">
                    <div>
                      <span className="text-slate-500">SHA-256 Fingerprint: </span>
                      <span className="text-emerald-400 break-all">{cert.sha256_fingerprint}</span>
                    </div>
                    {cert.sha1_fingerprint && (
                      <div>
                        <span className="text-slate-500">SHA-1 Fingerprint: </span>
                        <span className="text-slate-400 break-all">{cert.sha1_fingerprint}</span>
                      </div>
                    )}
                    {cert.valid_from && cert.valid_until && (
                      <div className="text-slate-500 text-[10px] pt-1">
                        Validity: {cert.valid_from} → {cert.valid_until}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Native Libraries & Supply Chain Inventory */}
          <div className="report-card p-6 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <IconCpu size={18} className="text-cyan-400" />
                Native Libraries (.so) & Supply Chain Assets
              </h2>
              <p className="text-xs text-slate-400">
                Compiled C/C++ native code libraries packaged inside the APK.
              </p>
            </div>

            {identity.native_libraries.length === 0 ? (
              <div className="py-4 text-xs text-slate-400">
                No native C/C++ libraries (.so) found. Application runs exclusively on Dalvik/ART virtual machine.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                {identity.native_libraries.slice(0, 16).map((lib, lIdx) => (
                  <div key={lIdx} className="p-2.5 rounded-lg bg-[#0e0f1a] border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300 truncate max-w-[220px]" title={lib.name}>
                      {lib.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {lib.abi} ({(lib.size_bytes / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
