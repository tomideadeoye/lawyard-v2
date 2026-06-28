import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Lawyard Directory | Legal Marketplace",
  description: "Nigeria's legal marketplace — find lawyers, law chambers, and legal services by specialty, location, and budget.",
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
