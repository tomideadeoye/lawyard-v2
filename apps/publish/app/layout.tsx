import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { CartProvider } from "../components/CartContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CookieConsent from "@repo/ui/components/cookie-consent";
import NewsletterPopup from "@repo/ui/components/newsletter-popup";
import { subscribeToNewsletter } from "@/app/actions/newsletter";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lawyard.ng"),
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
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Lawyard | Legal News, Opinions & Media Platform",
    description:
      "Nigeria's premier legal media platform. Legal news, opinions, analysis, and comprehensive coverage of the legal landscape in Africa.",
    type: "website",
    url: "https://lawyard.ng",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'system';
                const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider defaultTheme="system">
          <CartProvider>
            <div className="flex flex-col min-h-screen w-full">
              <Header />
              <main className="flex-1 w-full">{children}</main>
              <Footer />
              <CookieConsent />
              <NewsletterPopup onSubscribe={subscribeToNewsletter} />
            </div>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
