import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BlastRadius // DeFi Dependency & Blast Radius Intelligence",
  description:
    "Cryptographically provenanced DeFi dependency topology monitor and blast radius intelligence engine powered by Arkiv.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.svg"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body className={`${jetbrainsMono.className} antialiased`}>{children}</body>
    </html>
  );
}
