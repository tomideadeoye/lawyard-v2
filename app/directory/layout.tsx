import type { Metadata } from "next"
import { TERMS } from "@/lib/constants"

export const metadata: Metadata = {
  // The directory is served from its own host, so relative canonicals must
  // resolve there rather than to the news site's origin.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://directory.lawyard.org"
  ),
  title: "Lawyard Directory | Legal Marketplace",
  description: `Nigeria's legal marketplace — find ${TERMS.lawyer.lowerPlural}, ${TERMS.firm.lowerPlural}, and legal services by specialty, location, and budget.`,
}

import Header from "@/components/directory/Header";
import FooterWrapper from "@/components/directory/dashboard/FooterWrapper";

export default function DirectoryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header />
      <main className="flex-1 w-full">{children}</main>
      <FooterWrapper />
    </div>
  );
}
