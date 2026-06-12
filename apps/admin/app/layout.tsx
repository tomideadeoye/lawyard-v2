import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lawyard-v2.vercel.app"),
  title: "Lawyard Admin",
  description: "Administrative dashboard for Lawyard v2 — lawyer verification, content management, and system monitoring.",
  keywords: ["Lawyard", "admin", "dashboard", "lawyer verification", "legal directory"],
  authors: [{ name: "Lawyard", url: "https://www.lawyard.org" }],
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Lawyard Admin",
    description: "Administrative dashboard for Lawyard v2 — lawyer verification, content management, and system monitoring.",
    type: "website",
    url: "https://lawyard-v2.vercel.app",
    siteName: "Lawyard",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 1200,
        alt: "Lawyard Admin",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@lawyardOrg",
    creator: "@lawyardOrg",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
