'use client';

import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { useNetworkStatus, SlowNetworkAlert } from '@/components/states/network-states';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isOnline, isSlow } = useNetworkStatus();
  const [dismissSlow, setDismissSlow] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground antialiased">
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
      
      <div className="flex flex-1 flex-col min-w-0">
        {/* Live Network States Banners */}
        {isOnline && isSlow && !dismissSlow && (
          <SlowNetworkAlert onDismiss={() => setDismissSlow(true)} />
        )}

        {/* Mobile Header bar (only shown on mobile screens) */}
        <div className="lg:hidden flex h-14 items-center justify-between border-b border-border/80 bg-background/95 px-4 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-md hover:bg-muted text-foreground"
            aria-label="Toggle menu"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-semibold text-sm">mngmt</span>
          <div className="size-6" />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-6xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
