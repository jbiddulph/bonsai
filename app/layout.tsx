import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { UserButton } from "@neondatabase/auth-ui";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bonsai",
  description: "Next.js app with Neon Auth, hosted on Netlify",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Providers>
          <header className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Bonsai
            </Link>
            <UserButton size="icon" />
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
