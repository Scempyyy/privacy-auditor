import type { Metadata } from "next";
import "./globals.css";
import { Frame } from "@/components/Frame";

export const metadata: Metadata = {
  title: "Android Privacy Auditor",
  description: "Deterministic static privacy auditing and tracker detection tool for Android APKs.",
  icons: {
    icon: "/favicon.svg",
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
