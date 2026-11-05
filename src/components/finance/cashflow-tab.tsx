'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { formatIDR } from '@/lib/currency';

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

  const { totalInflow, totalOutflow } = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    for (const t of filteredTransactions) {
      if (t.type === 'income') inflow += t.amount;
      else if (t.type === 'expense') outflow += t.amount;
    }
    return { totalInflow: inflow, totalOutflow: outflow };
  }, [filteredTransactions]);

  const netCashFlow = totalInflow - totalOutflow;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-muted/20 p-2.5 rounded-lg border border-border/50">
        <span className="text-xs font-medium text-foreground">Filter by Period:</span>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="h-8 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none"
        >
          <option value="all">All Time</option>
          {availableMonths.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs">
          <div className="text-xs font-medium text-muted-foreground">Total Cash Inflow</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatIDR(totalInflow)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {selectedMonth === 'all' ? 'All incoming cash across accounts' : `Incoming cash in ${selectedMonth}`}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs">
          <div className="text-xs font-medium text-muted-foreground">Total Cash Outflow</div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {formatIDR(totalOutflow)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {selectedMonth === 'all' ? 'Expenses, inventory purchases, bills' : `Expenses in ${selectedMonth}`}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs">
          <div className="text-xs font-medium text-muted-foreground">Net Cash Flow</div>
          <div
            className={`text-2xl font-bold mt-1 ${
              netCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {netCashFlow >= 0 ? '+' : ''}
            {formatIDR(netCashFlow)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Net operating liquidity surplus</div>
        </div>
      </div>

      <div className="p-5 rounded-xl border border-border bg-card shadow-2xs space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Current Account Balances</h3>
        <div className="space-y-3">
          {accounts.map((acc) => {
            const total = accounts.reduce((sum, a) => sum + a.balance, 0);
            const percent = total > 0 ? Math.round((acc.balance / total) * 100) : 0;
            return (
              <div key={acc.id} className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">{acc.name}</span>
                  <span className="font-semibold text-foreground">{formatIDR(acc.balance)} ({percent}%)</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
