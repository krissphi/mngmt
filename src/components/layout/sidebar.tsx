'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  LayoutDashboard,
  Wallet,
  Sparkles,
  Store,
  Receipt,
  BarChart3,
  Settings,
  X,
  Layers,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const navItems: NavGroup[] = [
    {
      title: 'Main Navigation',
      items: [
        { label: 'Dashboard', href: '/', icon: LayoutDashboard },
        { label: 'Finance', href: '/finance', icon: Wallet },
        { label: 'Collection', href: '/collection', icon: Sparkles },
        { label: 'Seller', href: '/seller', icon: Store },
      ],
    },
    {
      title: 'Analytics & Tools',
      items: [
        { label: 'Ledger', href: '/ledger', icon: Receipt },
        { label: 'Reports', href: '/reports', icon: BarChart3 },
        { label: 'Settings', href: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-60 flex-col border-r border-border/40 bg-sidebar transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 print:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-15 items-center justify-between px-5 border-b border-border/40">
          <Link href="/" className="flex items-center gap-2.5 group" onClick={onCloseMobile}>
            <div className="size-7 rounded-lg bg-primary/10 border border-border/60 text-foreground flex items-center justify-center font-bold shadow-sm group-hover:bg-primary/15 transition-colors">
              <Layers className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold tracking-tight text-sm text-foreground">mngmt</span>
            </div>
          </Link>
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-muted-foreground hover:text-foreground rounded-lg"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          {navItems.map((group) => (
            <div key={group.title} className="space-y-1.5">
              <div className="px-3 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                {group.title}
              </div>
              <div className="space-y-0.5 pt-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs border border-border/60'
                          : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50'
                      }`}
                    >
                      <Icon className={`size-4 shrink-0 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3.5 border-t border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="text-[11px] text-muted-foreground font-medium">Local-First IDB</span>
          </div>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
