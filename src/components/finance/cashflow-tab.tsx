'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { formatIDR, formatSignedIDR } from '@/lib/currency';
import { SummaryBanner } from '@/components/shared/summary-banner';
import { StatCard } from '@/components/shared/stat-card';

export function CashFlowTab() {
  const { accounts, transactions } = useStore();
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => t.date && set.add(t.date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (selectedMonth === 'all') return transactions;
    return transactions.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  const { totalInflow, totalOutflow, inflowCount, outflowCount } = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    let inC = 0;
    let outC = 0;
    for (const t of filteredTransactions) {
      if (t.type === 'income') {
        inflow += t.amount;
        inC++;
      } else if (t.type === 'expense') {
        outflow += t.amount;
        outC++;
      }
    }
    return {
      totalInflow: inflow,
      totalOutflow: outflow,
      inflowCount: inC,
      outflowCount: outC,
    };
  }, [filteredTransactions]);

  const netCashFlow = totalInflow - totalOutflow;
  const totalAccountBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + a.balance, 0),
    [accounts]
  );

  return (
    <div className="space-y-6">
      <SummaryBanner
        label={`Net Cash Flow (${selectedMonth === 'all' ? 'All Time' : selectedMonth})`}
        value={formatSignedIDR(netCashFlow)}
        valueClassName={netCashFlow >= 0 ? 'text-emerald-500' : 'text-rose-500'}
        meta={[
          `${inflowCount + outflowCount} Cash Movements`,
          `Inflow ${formatIDR(totalInflow)}`,
          `Outflow ${formatIDR(totalOutflow)}`,
        ]}
        actions={
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-8.5 rounded-lg border border-border/60 bg-card/60 px-2.5 text-xs text-foreground focus-visible:outline-none"
            aria-label="Filter cashflow period"
          >
            <option value="all">All Time</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Cash Inflow"
          value={formatIDR(totalInflow)}
          valueClassName="text-emerald-500"
          subtitle={`${inflowCount} incoming transactions`}
        />
        <StatCard
          title="Total Cash Outflow"
          value={formatIDR(totalOutflow)}
          valueClassName="text-rose-500"
          subtitle={`${outflowCount} outgoing transactions`}
        />
        <StatCard
          title="Current Pocket Liquidity"
          value={formatIDR(totalAccountBalance)}
          subtitle={`Across ${accounts.length} pockets`}
        />
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <h3 className="text-sm font-semibold text-foreground">Current Account Balances</h3>
          <span className="text-xs font-mono text-muted-foreground tabular-nums">
            {formatIDR(totalAccountBalance)}
          </span>
        </div>
        <div className="space-y-3">
          {accounts.map((acc) => {
            const percent = totalAccountBalance > 0 ? Math.round((acc.balance / totalAccountBalance) * 100) : 0;
            return (
              <div key={acc.id} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground truncate">{acc.name}</span>
                  <span className="font-semibold font-mono tabular-nums text-foreground shrink-0">
                    {formatIDR(acc.balance)} ({percent}%)
                  </span>
                </div>
                <div className="w-full bg-secondary/50 rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
