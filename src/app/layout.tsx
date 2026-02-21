import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { AuthProviderWrapper } from "@/providers/auth-provider";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Galaxy S26 예약관리",
  description: "삼성 Galaxy S26 시리즈 사전예약 및 재고 매칭 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConvexClientProvider>
          <AuthProviderWrapper>
            <Header />
            <main className="container mx-auto px-4 py-6">{children}</main>
            <Toaster />
          </AuthProviderWrapper>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
