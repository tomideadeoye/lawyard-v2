import { CartProvider } from "../../components/CartContext";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import CookieConsent from "@/components/ui/cookie-consent";
import NewsletterPopup from "@/components/ui/newsletter-popup";
import { subscribeToNewsletter } from "@/app/actions/newsletter";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CartProvider>
      <div className="flex flex-col min-h-screen w-full">
        <Header />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
        <CookieConsent />
        <NewsletterPopup onSubscribe={subscribeToNewsletter} />
      </div>
    </CartProvider>
  );
}
