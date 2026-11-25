'use client';

import React from 'react';
import { formatIDR, formatCompactIDR } from '@/lib/currency';
import { StatCard } from '@/components/shared/stat-card';

interface DashboardSummaryKpiProps {
  totalCash: number;
  personalIncome: number;
  personalExpenses: number;
  incomeLabel?: string;
  businessRevenue: number;
  businessNetProfit: number;
  availableStockCount: number;
  inventoryCapitalValue: number;
}

export function DashboardSummaryKpi({
  totalCash,
  personalIncome,
  personalExpenses,
  incomeLabel = 'Monthly Income',
  businessRevenue,
  businessNetProfit,
  availableStockCount,
  inventoryCapitalValue,
}: DashboardSummaryKpiProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        title="Total Pocket Balance"
        value={formatIDR(totalCash)}
        subtitle="All active liquid pockets"
      />
      <StatCard
        title={incomeLabel}
        value={formatIDR(personalIncome)}
        subtitle={
          <span>
            Expense: <span className="text-foreground/90 font-mono">{formatIDR(personalExpenses)}</span>
          </span>
        }
      />
      <StatCard
        title="Seller Revenue"
        value={formatIDR(businessRevenue)}
        subtitle={
          <span className="text-emerald-500">
            Net Profit: <span className="font-mono">{formatIDR(businessNetProfit)}</span>
          </span>
        }
      />
      <StatCard
        title="Active Store Stock"
        value={`${availableStockCount} units`}
        subtitle={`Cost Basis: ${formatCompactIDR(inventoryCapitalValue)}`}
      />
    </div>
  );
}
