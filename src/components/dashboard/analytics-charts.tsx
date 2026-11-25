'use client';

import React from 'react';
import { formatIDR } from '@/lib/currency';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

interface AnalyticsChartsProps {
  chartData: Array<{
    name: string;
    income: number;
    expenses: number;
    revenue: number;
    profit: number;
  }>;
  periodLabel?: string;
}

function formatAxisTick(val: number): string {
  if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(val % 1_000_000 === 0 ? 0 : 1)}M`;
  if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
  return String(val);
}

export function AnalyticsCharts({ chartData, periodLabel }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Inflow vs Outflow */}
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div>
            <span className="text-sm font-semibold text-foreground">Cash Inflow & Outflow</span>
            {periodLabel && <p className="text-[11px] text-muted-foreground mt-0.5">{periodLabel}</p>}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-400" /> Inflow
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-rose-400" /> Outflow
            </span>
          </div>
        </div>

        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.08} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatAxisTick}
              />
              <Tooltip
                formatter={(val: unknown) => formatIDR(Number(val))}
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  borderColor: 'var(--border)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  color: 'var(--popover-foreground)',
                }}
              />
              <Bar dataKey="income" name="Inflow" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Outflow" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Revenue vs Net Profit */}
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div>
            <span className="text-sm font-semibold text-foreground">Sales Revenue & Profit</span>
            {periodLabel && <p className="text-[11px] text-muted-foreground mt-0.5">{periodLabel}</p>}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-indigo-400" /> Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-sky-400" /> Profit
            </span>
          </div>
        </div>

        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.08} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatAxisTick}
              />
              <Tooltip
                formatter={(val: unknown) => formatIDR(Number(val))}
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  borderColor: 'var(--border)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  color: 'var(--popover-foreground)',
                }}
              />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#818cf8" strokeWidth={1.75} fill="url(#revGrad)" />
              <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#38bdf8" strokeWidth={1.75} fill="url(#profitGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
