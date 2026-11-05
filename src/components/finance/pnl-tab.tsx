'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { formatIDR } from '@/lib/currency';

export function PnlTab() {
  const { transactions, sales } = useStore();
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((s) => s.saleDate && set.add(s.saleDate.slice(0, 7)));
    transactions.forEach((t) => t.date && set.add(t.date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [sales, transactions]);

  const filteredSales = useMemo(() => {
    if (selectedMonth === 'all') return sales;
    return sales.filter((s) => s.saleDate.startsWith(selectedMonth));
  }, [sales, selectedMonth]);

  const filteredTransactions = useMemo(() => {
    if (selectedMonth === 'all') return transactions;
    return transactions.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  const {
    pnlGrossRevenue,
    pnlCogs,
    pnlGrossProfit,
    pnlMarketplaceFees,
    pnlPackingCosts,
    pnlDiscounts,
  } = useMemo(() => {
    let rev = 0;
    let cogs = 0;
    let fees = 0;
    let packing = 0;
    let disc = 0;
    for (const s of filteredSales) {
      rev += s.grossSales;
      cogs += s.cogsTotal;
      fees += s.marketplaceFees;
      packing += s.packingCosts;
      disc += s.discounts;
    }
    return {
      pnlGrossRevenue: rev,
      pnlCogs: cogs,
      pnlGrossProfit: rev - cogs,
      pnlMarketplaceFees: fees,
      pnlPackingCosts: packing,
      pnlDiscounts: disc,
    };
  }, [filteredSales]);

  const pnlOperatingExpenses = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.scope === 'business' && t.type === 'expense' && t.sourceModule === 'business_expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const pnlNetProfit =
    pnlGrossProfit - pnlMarketplaceFees - pnlPackingCosts - pnlDiscounts - pnlOperatingExpenses;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-muted/20 p-2.5 rounded-lg border border-border/50 max-w-2xl mx-auto">
        <span className="text-xs font-medium text-foreground">Select Accounting Period:</span>
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

      <div className="p-5 rounded-xl border border-border bg-card shadow-2xs max-w-2xl mx-auto space-y-5">
        <div className="border-b border-border pb-3">
          <h3 className="text-base font-bold text-foreground">Business Profit & Loss Statement</h3>
          <p className="text-xs text-muted-foreground">
            {selectedMonth === 'all'
              ? 'Accrual accounting statement matching gross revenue against Cost of Goods Sold (COGS).'
              : `Accounting statement for period ${selectedMonth}.`}
          </p>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-1">
            <span className="font-semibold text-foreground">1. Gross Sales Revenue</span>
            <span className="font-bold text-foreground">{formatIDR(pnlGrossRevenue)}</span>
          </div>

          <div className="flex justify-between py-1 pl-4 text-muted-foreground border-b border-border/50">
            <span>Cost of Goods Sold (COGS)</span>
            <span className="text-rose-600 font-medium">-{formatIDR(pnlCogs)}</span>
          </div>

          <div className="flex justify-between py-1.5 font-bold text-sm bg-muted/30 px-3 rounded-lg">
            <span>GROSS PROFIT</span>
            <span className="text-emerald-600 dark:text-emerald-400">{formatIDR(pnlGrossProfit)}</span>
          </div>

          <div className="pt-2 font-semibold text-foreground">2. Operating Expenses & Deductions:</div>

          <div className="pl-4 space-y-1.5 text-muted-foreground">
            <div className="flex justify-between">
              <span>Marketplace Platform & Admin Fees</span>
              <span className="text-rose-600">-{formatIDR(pnlMarketplaceFees)}</span>
            </div>
            <div className="flex justify-between">
              <span>Packaging & Bubble Wrap Materials</span>
              <span className="text-rose-600">-{formatIDR(pnlPackingCosts)}</span>
            </div>
            {pnlDiscounts > 0 && (
              <div className="flex justify-between">
                <span>Discounts & Promotional Vouchers</span>
                <span className="text-rose-600">-{formatIDR(pnlDiscounts)}</span>
              </div>
            )}
            {pnlOperatingExpenses > 0 && (
              <div className="flex justify-between">
                <span>Other Business Operating Expenses</span>
                <span className="text-rose-600">-{formatIDR(pnlOperatingExpenses)}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border flex justify-between items-center bg-emerald-500/10 dark:bg-emerald-500/15 p-3 rounded-lg text-sm">
            <span className="font-bold text-foreground">OPERATING NET PROFIT</span>
            <span className="font-black text-base text-emerald-600 dark:text-emerald-400">
              {formatIDR(pnlNetProfit)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
