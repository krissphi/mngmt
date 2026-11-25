'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { formatIDR } from '@/lib/currency';
import { isValidSale } from '@/lib/calculations';
import { SummaryBanner } from '@/components/shared/summary-banner';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

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
    const active = sales.filter(isValidSale);
    if (selectedMonth === 'all') return active;
    return active.filter((s) => s.saleDate.startsWith(selectedMonth));
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
    pnlShippingCosts,
    pnlDiscounts,
  } = useMemo(() => {
    let rev = 0;
    let cogs = 0;
    let fees = 0;
    let packing = 0;
    let shipping = 0;
    let disc = 0;
    for (const s of filteredSales) {
      rev += s.grossSales;
      cogs += s.cogsTotal;
      fees += s.marketplaceFees;
      packing += s.packingCosts;
      shipping += s.shippingCosts || 0;
      disc += s.discounts;
    }
    return {
      pnlGrossRevenue: rev,
      pnlCogs: cogs,
      pnlGrossProfit: rev - cogs,
      pnlMarketplaceFees: fees,
      pnlPackingCosts: packing,
      pnlShippingCosts: shipping,
      pnlDiscounts: disc,
    };
  }, [filteredSales]);

  const pnlOperatingExpenses = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.scope === 'business' && t.type === 'expense' && t.sourceModule === 'business_expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const pnlNetProfit =
    pnlGrossProfit - pnlMarketplaceFees - pnlPackingCosts - pnlShippingCosts - pnlDiscounts - pnlOperatingExpenses;
  const marginPct = pnlGrossRevenue > 0 ? Math.round((pnlNetProfit / pnlGrossRevenue) * 100) : 0;

  return (
    <div className="space-y-6">
      <SummaryBanner
        label={`Operating Net Profit (${selectedMonth === 'all' ? 'All Time' : selectedMonth})`}
        value={formatIDR(pnlNetProfit)}
        valueClassName={pnlNetProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}
        meta={[
          `${filteredSales.length} Valid Orders`,
          `Revenue ${formatIDR(pnlGrossRevenue)}`,
          `COGS ${formatIDR(pnlCogs)}`,
          `Net Margin ${marginPct}%`,
        ]}
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-8.5 rounded-lg border border-border/60 bg-card/60 px-2.5 text-xs text-foreground focus-visible:outline-none"
              aria-label="Select accounting period"
            >
              <option value="all">All Time</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <Button onClick={() => window.print()} variant="outline" size="sm" className="text-xs h-8.5 gap-1.5 rounded-lg border-border/60">
              <Printer className="size-3.5" />
              <span>Print</span>
            </Button>
          </div>
        }
      />

      <div className="p-5 sm:p-6 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs max-w-3xl space-y-5">
        <div className="border-b border-border/50 pb-3">
          <h3 className="text-base font-bold text-foreground">Business Profit &amp; Loss Statement</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {selectedMonth === 'all'
              ? 'Accrual accounting statement matching valid gross revenue against Cost of Goods Sold (COGS).'
              : `Accounting statement for period ${selectedMonth} (excludes cancelled & returned orders).`}
          </p>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between gap-4 py-1">
            <span className="font-semibold text-foreground">1. Gross Sales Revenue</span>
            <span className="font-bold font-mono tabular-nums text-foreground shrink-0">{formatIDR(pnlGrossRevenue)}</span>
          </div>

          <div className="flex justify-between gap-4 py-1 pl-4 text-muted-foreground border-b border-border/50">
            <span>Cost of Goods Sold (COGS)</span>
            <span className="text-rose-500 font-medium font-mono tabular-nums shrink-0">-{formatIDR(pnlCogs)}</span>
          </div>

          <div className="flex justify-between gap-4 py-2 font-bold text-sm bg-muted/30 px-3 rounded-xl">
            <span>GROSS PROFIT</span>
            <span className="text-emerald-500 font-mono tabular-nums shrink-0">{formatIDR(pnlGrossProfit)}</span>
          </div>

          <div className="pt-2 font-semibold text-foreground">2. Operating Expenses &amp; Deductions</div>

          <div className="pl-4 space-y-1.5 text-muted-foreground">
            <div className="flex justify-between gap-4">
              <span>Marketplace Platform &amp; Admin Fees</span>
              <span className="text-rose-500 font-mono tabular-nums shrink-0">-{formatIDR(pnlMarketplaceFees)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Packaging &amp; Bubble Wrap Materials</span>
              <span className="text-rose-500 font-mono tabular-nums shrink-0">-{formatIDR(pnlPackingCosts)}</span>
            </div>
            {pnlShippingCosts > 0 && (
              <div className="flex justify-between gap-4">
                <span>Shipping &amp; Courier Subsidies</span>
                <span className="text-rose-500 font-mono tabular-nums shrink-0">-{formatIDR(pnlShippingCosts)}</span>
              </div>
            )}
            {pnlDiscounts > 0 && (
              <div className="flex justify-between gap-4">
                <span>Discounts &amp; Promotional Vouchers</span>
                <span className="text-rose-500 font-mono tabular-nums shrink-0">-{formatIDR(pnlDiscounts)}</span>
              </div>
            )}
            {pnlOperatingExpenses > 0 && (
              <div className="flex justify-between gap-4">
                <span>Other Business Operating Expenses</span>
                <span className="text-rose-500 font-mono tabular-nums shrink-0">-{formatIDR(pnlOperatingExpenses)}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border/60 flex justify-between items-center gap-4 bg-emerald-500/10 p-3.5 rounded-xl text-sm">
            <span className="font-bold text-foreground">OPERATING NET PROFIT</span>
            <span className={`font-bold font-mono tabular-nums text-base sm:text-lg shrink-0 ${pnlNetProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {formatIDR(pnlNetProfit)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
