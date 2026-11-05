'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatIDR, formatCompactIDR } from '@/lib/currency';
import { Transaction, Account, Category } from '@/types';
import { PieChart as PieIcon, Wallet } from 'lucide-react';

interface DonutDistributionChartsProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}

const DEFAULT_COLORS = [
  '#2563EB', // Blue
  '#059669', // Emerald
  '#D97706', // Amber
  '#DC2626', // Red
  '#7C3AED', // Purple
  '#0284C7', // Sky
  '#64748B', // Slate
];

export function DonutDistributionCharts({
  transactions,
  accounts,
  categories,
}: DonutDistributionChartsProps) {
  // 1. Expense Distribution Data
  const expenseData = useMemo(() => {
    const expenseTrx = transactions.filter((t) => t.type === 'expense');
    const total = expenseTrx.reduce((acc, t) => acc + t.amount, 0);

    if (total === 0) return { items: [], total: 0 };

    const map = new Map<string, number>();
    for (const t of expenseTrx) {
      const catId = t.categoryId || 'uncategorized';
      const current = map.get(catId) || 0;
      map.set(catId, current + t.amount);
    }

    const sorted = Array.from(map.entries())
      .map(([catId, amount]) => {
        const cat = catId !== 'uncategorized' ? categories.find((c) => c.id === catId) : undefined;
        return {
          id: catId,
          name: cat ? cat.name : 'Other',
          color: cat?.color,
          value: amount,
          percentage: (amount / total) * 100,
        };
      })
      .sort((a, b) => b.value - a.value);

    if (sorted.length > 5) {
      const top4 = sorted.slice(0, 4);
      const rest = sorted.slice(4);
      const restValue = rest.reduce((s, r) => s + r.value, 0);
      top4.push({
        id: 'cat-rest',
        name: 'Other',
        color: '#94A3B8',
        value: restValue,
        percentage: (restValue / total) * 100,
      });
      return {
        items: top4.map((item, idx) => ({
          ...item,
          color: item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
        })),
        total,
      };
    }

    return {
      items: sorted.map((item, idx) => ({
        ...item,
        color: item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
      })),
      total,
    };
  }, [transactions, categories]);

  // 2. Account Balance Allocation Data
  const accountData = useMemo(() => {
    const activeAccounts = accounts.filter((a) => a.balance > 0);
    const total = activeAccounts.reduce((acc, a) => acc + a.balance, 0);

    if (total === 0) return { items: [], total: 0 };

    const sorted = activeAccounts
      .map((acc, idx) => ({
        id: acc.id,
        name: acc.name,
        value: acc.balance,
        color: acc.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
        percentage: (acc.balance / total) * 100,
      }))
      .sort((a, b) => b.value - a.value);

    if (sorted.length > 5) {
      const top4 = sorted.slice(0, 4);
      const rest = sorted.slice(4);
      const restValue = rest.reduce((s, r) => s + r.value, 0);
      top4.push({
        id: 'acc-rest',
        name: 'Other Accounts',
        color: '#94A3B8',
        value: restValue,
        percentage: (restValue / total) * 100,
      });
      return { items: top4, total };
    }

    return { items: sorted, total };
  }, [accounts]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Expense Distribution */}
      <Card className="border-border/60 bg-card">
        <CardHeader className="py-4 px-5 border-b border-border/60 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <PieIcon className="size-4 text-rose-500" />
            <CardTitle className="text-sm font-semibold text-foreground">
              Expense Distribution
            </CardTitle>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            Total: {formatCompactIDR(expenseData.total)}
          </span>
        </CardHeader>
        <CardContent className="p-5">
          {expenseData.items.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
              No expense data recorded in this period.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-44 w-44 shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(val: unknown) => [formatIDR(Number(val)), 'Expense']}
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                    />
                    <Pie
                      data={expenseData.items}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {expenseData.items.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="flex-1 w-full space-y-2">
                {expenseData.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate text-foreground font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-muted-foreground font-mono text-[11px]">
                        {item.percentage.toFixed(0)}%
                      </span>
                      <span className="text-foreground font-medium text-[11px]">
                        {formatCompactIDR(item.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart 2: Account Balance Distribution */}
      <Card className="border-border/60 bg-card">
        <CardHeader className="py-4 px-5 border-b border-border/60 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-foreground">
              Account Balances
            </CardTitle>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            Total: {formatCompactIDR(accountData.total)}
          </span>
        </CardHeader>
        <CardContent className="p-5">
          {accountData.items.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
              No active account balances found.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-44 w-44 shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(val: unknown) => [formatIDR(Number(val)), 'Balance']}
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                    />
                    <Pie
                      data={accountData.items}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {accountData.items.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="flex-1 w-full space-y-2">
                {accountData.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate text-foreground font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-muted-foreground font-mono text-[11px]">
                        {item.percentage.toFixed(0)}%
                      </span>
                      <span className="text-foreground font-medium text-[11px]">
                        {formatCompactIDR(item.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
