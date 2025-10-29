import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import AuthProvider from "@/contexts/AuthProvider";
import Navbar from "@/components/Navbar";
import StoreProvider from "@/components/providers/StoreProvider";
import { PageTransitionLoader } from "@/components/ui/page-transition-loader";
import { Nunito_Sans } from "next/font/google";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-nunito-sans",
});

export const metadata: Metadata = {
  title: "Hiring Portal",
  description: "A comprehensive hiring portal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={nunitoSans.variable}>
      <body suppressHydrationWarning={true} className="font-sans">
        <AuthProvider>
          <StoreProvider>
            <PageTransitionLoader />
            <Navbar />
            <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
              {children}
            </main>
            <Toaster position="bottom-center" />
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
