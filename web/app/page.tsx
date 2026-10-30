"use client";

import Link from "next/link";
import {
  IconActivity,
  IconArrowRight,
  IconCheck,
  IconFileSearch,
  IconLock,
  IconShield,
  IconShieldCheck,
  IconSparkles,
} from "@tabler/icons-react";

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            ANDROID APP PRIVACY, MADE CLEAR
          </div>
          <h1>
            Know what your
            <br />
            <span>apps know.</span>
          </h1>
          <p className="hero-description">
            A clearer view of the permissions and trackers inside your Android apps. Inspect
            an APK before it gets access to your personal data.
          </p>
          <div className="hero-actions">
            <Link href="/scanner" className="button-primary">
              <IconFileSearch size={18} /> Analyze an APK <IconArrowRight size={16} />
            </Link>
            <Link href="/methodology" className="button-quiet">
              Explore our methodology <IconArrowRight size={15} />
            </Link>
          </div>
          <div className="hero-trust">
            <IconLock size={14} />
            <span>Private by design</span>
            <i />
            No install required
            <i />
            Purely static analysis
          </div>
        </div>

        <div
          className="hero-visual"
          aria-label="Illustration of an app privacy analysis"
          onPointerMove={(event) => {
            if (event.pointerType === "touch") return;
            const bounds = event.currentTarget.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width;
            const y = (event.clientY - bounds.top) / bounds.height;
            event.currentTarget.style.setProperty("--tilt-x", `${(x - 0.5) * 8}deg`);
            event.currentTarget.style.setProperty("--tilt-y", `${(0.5 - y) * 6}deg`);
            event.currentTarget.style.setProperty("--light-x", `${x * 100}%`);
            event.currentTarget.style.setProperty("--light-y", `${y * 100}%`);
          }}
          onPointerLeave={(event) => {
            event.currentTarget.style.setProperty("--tilt-x", "0deg");
            event.currentTarget.style.setProperty("--tilt-y", "0deg");
            event.currentTarget.style.setProperty("--light-x", "50%");
            event.currentTarget.style.setProperty("--light-y", "50%");
          }}
        >
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="hero-core">
            <div className="core-grid" />
            <div className="core-scanline" />
            <div className="core-icon">
              <IconShield size={48} stroke={1.5} />
            </div>
            <div className="core-caption">
              PRIVACY
              <br />
              SIGNAL
            </div>
          </div>
          <div className="float-card permission-float">
            <span className="float-icon purple">
              <IconLock size={16} />
            </span>
            <span>
              <b>Permissions</b>
              <small>Manifest inspected</small>
            </span>
            <IconCheck size={16} className="float-check" />
          </div>
          <div className="float-card tracker-float">
            <span className="float-icon cyan">
              <IconActivity size={16} />
            </span>
            <span>
              <b>Tracker scan</b>
              <small>Signature matching</small>
            </span>
            <span className="signal-bars">
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>
          <div className="visual-caption">
            <span className="caption-line" />
            Local-first APK review
          </div>
        </div>
      </section>

      {/* Feature Strip */}
      <section className="feature-strip">
        <div>
          <span className="feature-icon">
            <IconShieldCheck size={18} />
          </span>
          <span>
            <b>Permission clarity</b>
            <small>Declared vs. expected</small>
          </span>
        </div>
        <div>
          <span className="feature-icon">
            <IconActivity size={18} />
          </span>
          <span>
            <b>Tracker awareness</b>
            <small>Known SDK signatures</small>
          </span>
        </div>
        <div>
          <span className="feature-icon">
            <IconSparkles size={18} />
          </span>
          <span>
            <b>Transparent scoring</b>
            <small>Every deduction explained</small>
          </span>
        </div>
        <div>
          <span className="feature-icon">
            <IconLock size={18} />
          </span>
          <span>
            <b>Privacy first</b>
            <small>We never install your APK</small>
          </span>
        </div>
      </section>

      {/* Lower Section */}
      <section className="home-lower">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            A BETTER WAY TO CHECK
          </div>
          <h2>
            Confidence before
            <br />
            you tap install.
          </h2>
        </div>
        <p>
          Android&apos;s permission prompts happen at runtime when an app is already installed.
          An APK review gives you an earlier look at what an app declares, with contextual risk
          evaluations to make your own informed decision.
        </p>
        <Link href="/methodology" className="text-link">
          See how scoring works <IconArrowRight size={15} />
        </Link>
      </section>
    </>
  );
}
