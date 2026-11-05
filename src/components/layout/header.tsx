'use client';

import React, { useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { QuickActionModal } from '@/components/shared/quick-action-modal';
import { usePwa } from '@/components/pwa/pwa-provider';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const { isInstallable, isInstalled, installApp } = usePwa();

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border/80 bg-background/95 backdrop-blur-xs px-4 sm:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="lg:hidden p-1.5 rounded-md hover:bg-muted text-foreground transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
          mngmt System
        </span>
      </div>

      <div className="flex items-center gap-2">
        {isInstallable && !isInstalled && (
          <Button
            onClick={installApp}
            variant="outline"
            size="sm"
            className="text-xs h-8 px-2.5 gap-1.5 font-medium border-border/60 hover:bg-muted text-foreground"
            title="Install mngmt as a progressive web app"
          >
            <Download className="size-3 text-primary" />
            <span className="hidden sm:inline">Install App</span>
          </Button>
        )}

        <Button
          onClick={() => setQuickModalOpen(true)}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-2xs gap-1.5 text-xs h-8 px-3"
        >
          <Plus className="size-3.5" />
          <span>Record Transaction</span>
        </Button>

        <ThemeToggle />

        <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs select-none">
          M
        </div>
      </div>

      <QuickActionModal open={quickModalOpen} onOpenChange={setQuickModalOpen} />
    </header>
  );
}
