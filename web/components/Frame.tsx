"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconBrandAndroid,
  IconMenu2,
  IconShieldCheck,
  IconX,
} from "@tabler/icons-react";

export type NavItem = {
  href: string;
  label: string;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview" },
  { href: "/scanner", label: "APK scanner" },
  { href: "/dashboard", label: "Scan history" },
  { href: "/methodology", label: "Methodology" },
];

export function Frame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="auditor-frame">
      <header className="auditor-header">
        <Link href="/" className="auditor-brand" aria-label="Android Privacy Auditor home">
          <span className="brand-mark">
            <IconBrandAndroid size={21} stroke={1.8} />
          </span>
          <span className="brand-name">
            privacy<span>audit</span>
          </span>
        </Link>

        <nav className="auditor-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "nav-link active" : "nav-link"}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link href="/scanner" className="header-cta">
          <IconShieldCheck size={16} /> New scan <IconArrowRight size={15} />
        </Link>

        {/* Mobile Navigation */}
        <div className="mobile-nav-wrap">
          <button
            type="button"
            className="icon-button mobile-menu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <IconX size={19} /> : <IconMenu2 size={19} />}
          </button>
          {mobileMenuOpen && (
            <nav className="mobile-nav" aria-label="Mobile navigation">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={isActive ? "active" : ""}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      <main>{children}</main>

      <footer className="auditor-footer">
        <div className="footer-brand">
          <span className="brand-mark small">
            <IconBrandAndroid size={16} />
          </span>{" "}
          Android Privacy Auditor
        </div>
        <span>Understand what your apps can access.</span>
        <Link href="/methodology">
          How scoring works <IconArrowUpRight size={13} />
        </Link>
      </footer>
    </div>
  );
}
