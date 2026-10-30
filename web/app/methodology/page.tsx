import Link from "next/link";
import {
  IconActivity,
  IconArrowRight,
  IconFileSearch,
  IconInfoCircle,
  IconLock,
  IconShieldCheck,
  IconSparkles,
} from "@tabler/icons-react";

export default function MethodologyPage() {
  return (
    <section className="page-wrap methodology-page">
      <div className="page-heading">
        <div className="eyebrow">
          <span className="eyebrow-dot" />
          OPEN, EXPLAINABLE, STATIC
        </div>
        <h1>How the analysis works</h1>
        <p>
          Understand what a static Android package inspection uncovers—and where its practical
          boundaries lie.
        </p>
      </div>

      {/* Intro Box */}
      <div className="method-intro">
        <div className="method-emblem">
          <IconShieldCheck size={32} />
        </div>
        <div>
          <h2>Evidence, not guesswork.</h2>
          <p>
            The analyzer decompresses package metadata and matches class signatures against
            transparent, version-controlled security heuristics. It never installs or executes the
            APK binary on any device or emulator.
          </p>
        </div>
      </div>

      {/* 4 Method Cards */}
      <div className="method-cards">
        <MethodCard
          number="01"
          icon={<IconFileSearch size={20} />}
          title="Static APK inspection"
          text="The analyzer parses AndroidManifest.xml to extract package identity, version identifiers, and minimum/target SDK levels. It checks security hygiene flags like cleartext HTTP traffic and debuggable builds without executing any code."
        />
        <MethodCard
          number="02"
          icon={<IconLock size={20} />}
          title="Permission auditing"
          text="Declared Android permissions are cross-referenced with functional category expectations (e.g. Expected, Review, Unusual). Permissions in the same group are deduplicated with fractional weightings to avoid redundant penalties."
        />
        <MethodCard
          number="03"
          icon={<IconActivity size={20} />}
          title="Tracker signatures"
          text="DEX bytecode class hierarchies are scanned for recognized third-party advertising frameworks, behavioral profiling engines, and telemetry SDKs. Signatures are categorized with individual and domain penalty caps."
        />
        <MethodCard
          number="04"
          icon={<IconSparkles size={20} />}
          title="Deterministic scoring"
          text="The privacy score is calculated mathematically from a baseline of 100 points: Score = clamp(round(100 − P − T − S), 0, 100). Every single deducted point is itemized with an explanation. No runtime LLMs are in the scoring path."
        />
      </div>

      {/* Limitations Callout */}
      <div className="limitations-callout">
        <span>
          <IconInfoCircle size={18} />
        </span>
        <div>
          <h3>Static analysis has inherent limits</h3>
          <p>
            Static analysis cannot observe live encrypted network traffic, dynamic code loading,
            runtime server configurations, or actions taken after user authentication. A high score
            reflects good manifest hygiene and minimal embedded tracking libraries, not an absolute
            guarantee of data privacy.
          </p>
        </div>
      </div>

      {/* CTA Box */}
      <div className="method-cta">
        <div>
          <h2>Ready to inspect an APK?</h2>
          <p>Run a private audit on any Android package using your local analyzer.</p>
        </div>
        <Link href="/scanner" className="button-primary">
          Open the scanner <IconArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}

function MethodCard({
  number,
  icon,
  title,
  text,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="method-card">
      <div className="method-card-top">
        <span>{number}</span>
        <i>{icon}</i>
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}
