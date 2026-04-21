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
  title: "Lawyard Directory | Find Elite Legal Engineers & Lawyers",
  description: "The global directory for state-of-the-art legal talent. Find lawyers, legal engineers, and compliance experts at the intersection of law and technology.",
  keywords: ["lawyer directory", "legal engineering", "find lawyer", "nigerian lawyers", "tech law", "Adeoye Tomide"],
  authors: [{ name: "Orion", url: "https://orion.horizon" }],
  openGraph: {
    title: "Lawyard Directory",
    description: "Find Elite Legal Engineers & Lawyers",
    type: "website",
  },
};

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header />
          <main style={{ flex: 1 }}>
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
