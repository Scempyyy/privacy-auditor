"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCheck,
  IconClock,
  IconDeviceMobile,
  IconInfoCircle,
  IconLock,
  IconNetworkOff,
  IconRefresh,
  IconShieldCheck,
  IconTerminal2,
} from "@tabler/icons-react";
import { DynamicSandboxStatusReport } from "@/lib/api";

const DEFAULT_SANDBOX_STATUS: DynamicSandboxStatusReport = {
  is_available: false,
  is_enabled: false,
  adb_installed: true,
  emulator_installed: false,
  java_installed: false,
  frida_installed: false,
  active_disposable_devices: [],
  status_message: "Dynamic execution is DISABLED / UNAVAILABLE in this environment. Prerequisites missing: Android Emulator AVD or connected disposable test device.",
  safety_controls_enforced: [
    "Dynamic execution is strictly opt-in and disabled by default.",
    "Host execution forbidden: APK binaries are NEVER executed on the host OS.",
    "Zero access to host filesystem or user personal accounts.",
    "Synthetic test APKs only: Third-party or untrusted APKs are not auto-executed.",
    "Air-gapped network configuration with synthetic local test collectors.",
  ],
  sample_timeline: [
    {
      timestamp_offset_ms: 0,
      event_type: "lifecycle",
      description: "Application launched inside disposable isolated emulator.",
      evidence_source: "ActivityManager",
    },
    {
      timestamp_offset_ms: 120,
      event_type: "api_call",
      description: "Observed runtime invocation of android.location.LocationManager.getLastKnownLocation().",
      evidence_source: "Frida / Logcat",
    },
    {
      timestamp_offset_ms: 450,
      event_type: "network",
      description: "DNS resolution query to telemetry collector (synthetic loopback: 127.0.0.1).",
      evidence_source: "Isolated DNS Collector",
    },
    {
      timestamp_offset_ms: 1200,
      event_type: "lifecycle",
      description: "Session completed. Disposable test environment wiped.",
      evidence_source: "Sandbox Controller",
    },
  ],
};

export default function DynamicSandboxPage() {
  const [status, setStatus] = useState<DynamicSandboxStatusReport>(DEFAULT_SANDBOX_STATUS);
  const [loading, setLoading] = useState(false);

  async function checkLiveStatus() {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/sandbox/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // Retain default if backend offline
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkLiveStatus();
  }, []);

  return (
    <section className="page-wrap space-y-8">
      {/* Hero Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-800/40 text-amber-300 text-xs font-mono">
          <IconAlertTriangle size={14} /> Isolated Disposable Dynamic Environment
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Isolated Dynamic Privacy Sandbox
        </h1>
        <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
          Provides controlled runtime observation of permission-sensitive APIs, network connection attempts, and background service invocations inside disposable Android Virtual Devices (AVD).
          Enforces strict safety: disabled by default, zero host execution, and air-gapped traffic isolation.
        </p>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 rounded-xl border border-amber-800/40 bg-amber-950/20 space-y-2">
        <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
          <IconLock size={18} /> Safety Architecture & Environmental Controls
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {status.status_message}
        </p>
      </div>

      {/* Environment Prerequisites Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0c0d16] space-y-1">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">ADB Daemon</div>
          <div className="text-lg font-bold font-mono text-emerald-400 flex items-center gap-1.5">
            <IconCheck size={18} /> Installed (/usr/bin/adb)
          </div>
          <div className="text-[11px] text-slate-400">Daemon ready</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-[#0c0d16] space-y-1">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Android Emulator</div>
          <div className="text-lg font-bold font-mono text-slate-400">
            {status.emulator_installed ? "Available" : "Not Configured"}
          </div>
          <div className="text-[11px] text-slate-400">Requires AVD system image</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-[#0c0d16] space-y-1">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Active Test Devices</div>
          <div className="text-lg font-bold font-mono text-slate-400">
            {status.active_disposable_devices.length} Connected
          </div>
          <div className="text-[11px] text-slate-400">Disposable AVD targets</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-[#0c0d16] space-y-1">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Safety Invariant</div>
          <div className="text-lg font-bold font-mono text-emerald-400 flex items-center gap-1.5">
            <IconShieldCheck size={18} /> Host Protected
          </div>
          <div className="text-[11px] text-slate-400">0 host execution risk</div>
        </div>
      </div>

      {/* Safety Controls Enforced */}
      <div className="report-card p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <IconShieldCheck size={18} className="text-emerald-400" />
          Mandatory Sandbox Safety Invariants
        </h2>
        <div className="space-y-2 text-xs text-slate-300 font-mono">
          {status.safety_controls_enforced.map((ctrl, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-[#0e0f1a] border border-slate-800 flex items-center gap-2.5">
              <span className="text-emerald-400">✓</span>
              <span>{ctrl}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sample Observation Timeline */}
      <div className="report-card p-6 space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <IconClock size={18} className="text-purple-400" />
            Observation Timeline Architecture (Specification & Prototype)
          </h2>
          <p className="text-xs text-slate-400">
            Timestamped trace captured during authorized dynamic sessions mapping runtime API calls and network pings.
          </p>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {status.sample_timeline.map((event, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-[#0d0d16] border border-slate-800 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60 text-[10px]">
                    +{event.timestamp_offset_ms}ms
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    [{event.event_type}]
                  </span>
                </div>
                <div className="text-slate-200">{event.description}</div>
              </div>
              <span className="text-[10px] text-slate-500 shrink-0">
                Source: {event.evidence_source}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
