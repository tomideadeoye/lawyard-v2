import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { QueryProvider } from "../components/query-provider";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lawyard.org"),
  title: "Lawyard | Legal News, Opinions & Media Platform",
  description:
    "Nigeria's premier legal media platform. Legal news, opinions, analysis, Lawyard Spotlight, Lawyard TV, Podcasts, and comprehensive coverage of the legal landscape in Africa.",
  keywords: [
    "Legal news Nigeria",
    "Nigerian legal opinions",
    "Lawyard Spotlight",
    "Legal media Africa",
    "Sports law Nigeria",
    "Lawyard TV",
    "Lawyard Podcasts",
    "Nigerian judiciary",
    "Legal analysis Nigeria",
    "Nigerian Bar Association",
  ],
  authors: [{ name: "Lawyard", url: "https://www.lawyard.org" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-300x300.png", sizes: "300x300", type: "image/png" },
    ],
    apple: [
      { url: "/favicon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Lawyard | Legal News, Opinions & Media Platform",
    description:
      "Nigeria's premier legal media platform. Legal news, opinions, analysis, and comprehensive coverage of the legal landscape in Africa.",
    type: "website",
    url: "https://lawyard.org",
    siteName: "Lawyard",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 1200,
        alt: "Lawyard - Legal News & Media",
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
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <head suppressHydrationWarning />
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: '<script src="/theme-init.js"></script>' }} />
        <ThemeProvider defaultTheme="system">
          <QueryProvider>
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
