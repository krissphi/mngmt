import React, { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { StoreProvider } from '@/context/store-context';
import { AppShell } from '@/components/layout/app-shell';
import { PwaProvider } from '@/components/pwa/pwa-provider';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: '#090a0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'mngmt — Personal Finance & Business Management',
  description: 'Integrated personal wealth, business inventory, sales, and purchasing management system.',
  manifest: '/manifest.webmanifest',
  applicationName: 'mngmt',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'mngmt',
  },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <ThemeProvider>
          <StoreProvider>
            <PwaProvider>
              <AppShell>
                <Suspense fallback={<div className="p-8 text-xs text-muted-foreground">Loading...</div>}>
                  {children}
                </Suspense>
              </AppShell>
            </PwaProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
