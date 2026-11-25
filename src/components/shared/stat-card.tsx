'use client';

import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  valueClassName?: string;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  valueClassName = 'text-foreground',
  subtitle,
  icon,
  className = '',
}: StatCardProps) {
  return (
    <div
      className={`rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs p-4 sm:p-5 hover:border-border/80 hover:bg-card/80 transition-all duration-200 flex flex-col justify-between gap-1.5 min-w-0 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider leading-snug">
          {title}
        </span>
        {icon && <span className="shrink-0">{icon}</span>}
      </div>
      <div
        className={`text-lg sm:text-xl font-bold tracking-tight font-mono tabular-nums leading-snug break-words ${valueClassName}`}
      >
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-muted-foreground pt-0.5 font-medium leading-relaxed break-words">
          {subtitle}
        </div>
      )}
    </div>
  );
}
