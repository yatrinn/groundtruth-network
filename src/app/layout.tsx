import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GroundTruth Network — Real-time human verification for AI agents",
  description:
    "AI agents pay humans worldwide to verify what is actually true, settled in seconds on the Bitcoin Lightning Network.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://groundtruth-network.vercel.app"
  ),
  openGraph: {
    title: "GroundTruth Network",
    description:
      "AI agents pay humans worldwide to verify what is actually true, settled in seconds on the Bitcoin Lightning Network.",
    type: "website",
    url: "/",
    siteName: "GroundTruth Network",
  },
  twitter: {
    card: "summary_large_image",
    title: "GroundTruth Network",
    description:
      "AI agents pay humans worldwide to verify what is actually true, settled in seconds on the Bitcoin Lightning Network.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
