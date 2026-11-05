'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  LayoutDashboard,
  Wallet,
  Briefcase,
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
        { label: 'Personal Finance', href: '/personal', icon: Wallet },
        { label: 'Business & Assets', href: '/business', icon: Briefcase },
      ],
    },
    {
      title: 'Analytics & Ledger',
      items: [
        { label: 'General Ledger', href: '/finance', icon: Receipt },
        { label: 'Reports & Export', href: '/reports', icon: BarChart3 },
        { label: 'Settings', href: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-60 flex-col border-r border-border/80 bg-sidebar transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center justify-between px-5 border-b border-sidebar-border/80">
          <Link href="/" className="flex items-center gap-2.5" onClick={onCloseMobile}>
            <div className="size-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-2xs">
              <Layers className="size-4" />
            </div>
            <span className="font-semibold tracking-tight text-sm text-sidebar-foreground">mngmt</span>
          </Link>
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1 text-muted-foreground hover:text-foreground rounded-md"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navItems.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-2.5 text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                {group.title}
              </div>
              <div className="space-y-0.5 pt-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-primary font-semibold'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                      }`}
                    >
                      <Icon className={`size-4 ${isActive ? 'text-sidebar-primary' : 'text-muted-foreground'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-sidebar-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs select-none">
              M
            </div>
            <div className="text-[11px] leading-tight">
              <div className="font-semibold text-sidebar-foreground">mngmt</div>
              <div className="text-muted-foreground text-[10px]">Local First</div>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
