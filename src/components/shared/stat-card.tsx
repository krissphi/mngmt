'use client';

import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: React.ReactNode;
  className?: string;
}

export function StatCard({ title, value, subtitle, className = '' }: StatCardProps) {
  return (
    <div className={`p-4 rounded-xl border border-border bg-card shadow-xs transition-shadow hover:shadow-sm space-y-1 ${className}`}>
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
      <div className="text-2xl font-bold tracking-tight text-foreground truncate">{value}</div>
      {subtitle && <div className="text-[11px] text-muted-foreground truncate pt-0.5">{subtitle}</div>}
    </div>
  );
}
