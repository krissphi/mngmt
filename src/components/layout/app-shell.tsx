'use client';

import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { PinLockGate } from '@/components/shared/pin-lock-gate';
import { useNetworkStatus, SlowNetworkAlert } from '@/components/states/network-states';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isOnline, isSlow } = useNetworkStatus();
  const [dismissSlow, setDismissSlow] = useState(false);

  return (
    <PinLockGate>
      <div className="flex min-h-screen bg-background text-foreground antialiased">
        <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

        <div className="flex flex-1 flex-col min-w-0">
          {/* Live Network States Banners */}
          {isOnline && isSlow && !dismissSlow && (
            <SlowNetworkAlert onDismiss={() => setDismissSlow(true)} />
          )}

          {/* Unified Top Header (Desktop + Mobile) */}
          <Header onMobileMenuToggle={() => setMobileMenuOpen(true)} />

          {/* Main Content Area */}
          <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-6xl w-full mx-auto space-y-6">
            {children}
          </main>
        </div>
      </div>
    </PinLockGate>
  );
}
