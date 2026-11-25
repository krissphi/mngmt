'use client';

import React, { useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { QuickActionModal } from '@/components/shared/quick-action-modal';
import { usePwa } from '@/components/pwa/pwa-provider';
import { Button } from '@/components/ui/button';
import { Plus, Download, Menu } from 'lucide-react';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const { isInstallable, isInstalled, installApp } = usePwa();

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border/60 bg-background/90 backdrop-blur-md px-4 sm:px-8 print:hidden">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="lg:hidden p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="size-5" />
        </button>
        <span className="font-semibold text-sm lg:hidden">mngmt</span>
        <span className="text-xs font-medium text-muted-foreground hidden lg:inline">
          Personal Wealth &amp; Seller Workspace
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
            <Download className="size-3.5 text-primary" />
            <span className="hidden sm:inline">Install App</span>
          </Button>
        )}

        <Button
          onClick={() => setQuickModalOpen(true)}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-2xs gap-1.5 text-xs h-8 px-3 rounded-lg"
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">New Transaction</span>
          <span className="sm:hidden">Add</span>
        </Button>

        <div className="lg:hidden">
          <ThemeToggle className="size-8" />
        </div>
      </div>

      <QuickActionModal open={quickModalOpen} onOpenChange={setQuickModalOpen} />
    </header>
  );
}
