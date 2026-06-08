import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ClerkProvider } from '@clerk/nextjs'

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "FinGuard AI | Learn Investing, Avoid Scams",
  description: "AI-powered financial literacy and scam awareness platform for Indian investors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: `
            try {
              if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark')
              } else {
                document.documentElement.classList.remove('dark')
              }
            } catch (_) {}
          ` }} />
        </head>
        <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}>
          <QueryProvider>
            <Navbar />
            <main className="flex-1 bg-background">
              {children}
            </main>
            <Footer />
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
