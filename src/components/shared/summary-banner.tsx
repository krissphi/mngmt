'use client';

import React from 'react';

interface SummaryBannerProps {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
  meta?: Array<React.ReactNode> | React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Shared Pocket-style summary header used across Finance, Collection, Seller, Ledger, and Reports.
 * Renders a concise eyebrow label, full un-truncated monetary/count value, dot-separated metadata,
 * and right-aligned primary actions.
 */
export function SummaryBanner({
  label,
  value,
  valueClassName = 'text-foreground',
  meta,
  actions,
  className = '',
}: SummaryBannerProps) {
  const metaItems = Array.isArray(meta) ? meta.filter(Boolean) : null;

  return (
    <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1 ${className}`}>
      <div className="min-w-0">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest block">
          {label}
        </span>
        <div
          className={`text-2xl sm:text-3xl font-bold tracking-tight font-mono tabular-nums mt-0.5 break-words ${valueClassName}`}
        >
          {value}
        </div>
        {metaItems ? (
          metaItems.length > 0 && (
            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {metaItems.map((item, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span aria-hidden="true">•</span>}
                  <span>{item}</span>
                </React.Fragment>
              ))}
            </div>
          )
        ) : meta ? (
          <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {meta}
          </div>
        ) : null}
      </div>

      {actions && (
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
