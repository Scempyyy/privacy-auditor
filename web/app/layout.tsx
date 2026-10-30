import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Frame } from "@/components/Frame";

export const viewport: Viewport = {
  themeColor: "#9d75ee",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Android Privacy Auditor",
  description: "Deterministic static privacy auditing, permission intelligence, and tracker detection for Android APKs.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-screen bg-[#090910] text-[#e9e8f1] antialiased">
        <Frame>{children}</Frame>
      </body>
    </html>
  );
}
