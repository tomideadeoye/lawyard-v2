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

import siteConfig from "../config/site-config.json";

export const metadata: Metadata = {
  title: siteConfig.brand.seo.title,
  description: siteConfig.brand.seo.description,
  keywords: [
    "Legal media platform Nigeria",
    "Nigerian legal services",
    "Find a lawyer in Nigeria",
    "Nigerian legal news",
    "Lawyard Nigeria",
    "Sports law Nigeria",
    "Data protection law Nigeria",
    "Lawyer directory Nigeria",
    "Legislative updates Nigeria"
  ],
  authors: [{ name: "Lawyard", url: "https://www.lawyard.org" }],
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Lawyard Directory | Find Elite Legal Professionals",
    description: siteConfig.brand.seo.description,
    type: "website",
    url: "https://directory.lawyard.org",
    siteName: "Lawyard",
  },
  twitter: {
    card: "summary_large_image",
    site: "@lawyardOrg",
    creator: "@lawyardOrg",
  }
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
