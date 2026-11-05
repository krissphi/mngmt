'use client';

import React from 'react';
import { formatIDR, formatCompactIDR } from '@/lib/currency';
import { StatCard } from '@/components/shared/stat-card';

interface DashboardSummaryKpiProps {
  totalCash: number;
  personalIncome: number;
  personalExpenses: number;
  businessRevenue: number;
  businessNetProfit: number;
  availableStockCount: number;
  inventoryCapitalValue: number;
}

export function DashboardSummaryKpi({
  totalCash,
  personalIncome,
  personalExpenses,
  businessRevenue,
  businessNetProfit,
  availableStockCount,
  inventoryCapitalValue,
}: DashboardSummaryKpiProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Cash & Accounts"
        value={formatIDR(totalCash)}
        subtitle="Liquid funds across active accounts"
      />
      <StatCard
        title="Personal Inflows"
        value={formatIDR(personalIncome)}
        subtitle={`Expenses: ${formatIDR(personalExpenses)}`}
      />
      <StatCard
        title="Sales Revenue"
        value={formatIDR(businessRevenue)}
        subtitle={`Est. Net Profit: ${formatIDR(businessNetProfit)}`}
      />
      <StatCard
        title="Ready-to-Sell Stock"
        value={`${availableStockCount} units`}
        subtitle={`Capital Value: ${formatCompactIDR(inventoryCapitalValue)}`}
      />
    </div>
  );
}
