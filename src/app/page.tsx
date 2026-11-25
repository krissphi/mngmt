'use client';

import React, { useState, useMemo } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { useStore } from '@/context/store-context';
import { getAvailableStock, isSellableProduct, isValidSale } from '@/lib/calculations';
import { getLocalMonthString } from '@/lib/date';
import { PageHeader } from '@/components/shared/page-header';
import { DashboardSummaryKpi } from '@/components/dashboard/financial-kpi';
import { AnalyticsCharts } from '@/components/dashboard/analytics-charts';
import { DonutDistributionCharts } from '@/components/dashboard/donut-distribution-charts';
import { RecentActivity } from '@/components/dashboard/recent-activity';

type DateFilter = 'month' | 'year' | 'all';

function formatMonthLabel(m: string): string {
  try {
    const d = parseISO(`${m}-01`);
    return isValid(d) ? format(d, 'MMM yyyy') : m;
  } catch {
    return m;
  }
}

export default function DashboardPage() {
  const { accounts, products, sales, transactions, categories, isLoaded } = useStore();

  const [dateFilter, setDateFilter] = useState<DateFilter>('month');

  // Discover all available months from data
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => t.date && set.add(t.date.slice(0, 7)));
    sales.forEach((s) => s.saleDate && set.add(s.saleDate.slice(0, 7)));
    if (set.size === 0) set.add(getLocalMonthString());
    return Array.from(set).sort().reverse();
  }, [transactions, sales]);

  // Discover all available years from data
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => t.date && set.add(t.date.slice(0, 4)));
    sales.forEach((s) => s.saleDate && set.add(s.saleDate.slice(0, 4)));
    if (set.size === 0) set.add(format(new Date(), 'yyyy'));
    return Array.from(set).sort().reverse();
  }, [transactions, sales]);

  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  const effectiveMonth = selectedMonth || availableMonths[0] || getLocalMonthString();
  const effectiveYear = selectedYear || availableYears[0] || format(new Date(), 'yyyy');

  const totalCashBalance = useMemo(() => accounts.reduce((acc, a) => acc + a.balance, 0), [accounts]);

  // Synchronized transaction filtering based on active dateFilter mode
  const filteredTransactions = useMemo(() => {
    if (dateFilter === 'month') return transactions.filter((t) => t.date && t.date.startsWith(effectiveMonth));
    if (dateFilter === 'year') return transactions.filter((t) => t.date && t.date.startsWith(effectiveYear));
    return transactions;
  }, [transactions, dateFilter, effectiveMonth, effectiveYear]);

  // Synchronized personal inflows and outflows
  const { personalIncome, personalExpenses } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (const t of filteredTransactions) {
      if (t.scope === 'personal') {
        if (t.type === 'income') income += t.amount;
        else if (t.type === 'expense') expenses += t.amount;
      }
    }
    return { personalIncome: income, personalExpenses: expenses };
  }, [filteredTransactions]);

  // Canonical valid sales (excludes cancelled & returned orders)
  const allValidSales = useMemo(() => sales.filter(isValidSale), [sales]);

  const businessSalesFiltered = useMemo(() => {
    if (dateFilter === 'month') return allValidSales.filter((s) => s.saleDate && s.saleDate.startsWith(effectiveMonth));
    if (dateFilter === 'year') return allValidSales.filter((s) => s.saleDate && s.saleDate.startsWith(effectiveYear));
    return allValidSales;
  }, [allValidSales, dateFilter, effectiveMonth, effectiveYear]);

  const { businessRevenue, businessNetProfit } = useMemo(() => {
    let rev = 0;
    let profit = 0;
    for (const s of businessSalesFiltered) {
      rev += s.grossSales;
      profit += s.netProfit;
    }
    return { businessRevenue: rev, businessNetProfit: profit };
  }, [businessSalesFiltered]);

  // Sellable inventory only (excludes personal collectibles/assets)
  const { availableStockCount, inventoryCapitalValue, lowStockProducts } = useMemo(() => {
    let stock = 0;
    let capital = 0;
    const lowStock = [];
    for (const p of products) {
      if (!isSellableProduct(p)) continue;
      stock += getAvailableStock(p);
      capital += p.stockOnHand * p.purchaseCost;
      if (p.status === 'active' && p.stockOnHand <= p.minStockAlert) {
        lowStock.push(p);
      }
    }
    return { availableStockCount: stock, inventoryCapitalValue: capital, lowStockProducts: lowStock };
  }, [products]);

  // Dynamic, filter-responsive chart data (consistent with KPIs: excludes cancelled/returned)
  const { chartData, periodLabel } = useMemo(() => {
    if (dateFilter === 'month') {
      const [yStr, mStr] = effectiveMonth.split('-');
      const y = parseInt(yStr, 10) || 2026;
      const m = parseInt(mStr, 10) || 11;
      const daysInMonth = new Date(y, m, 0).getDate();

      const buckets = [
        { label: 'W1 (1-7)', start: 1, end: 7 },
        { label: 'W2 (8-14)', start: 8, end: 14 },
        { label: 'W3 (15-21)', start: 15, end: 21 },
        { label: 'W4 (22-28)', start: 22, end: 28 },
      ];
      if (daysInMonth > 28) {
        buckets.push({ label: `W5 (29-${daysInMonth})`, start: 29, end: daysInMonth });
      }

      const monthTrx = transactions.filter((t) => t.date && t.date.startsWith(effectiveMonth));
      const monthSales = allValidSales.filter((s) => s.saleDate && s.saleDate.startsWith(effectiveMonth));

      const data = buckets.map((b) => {
        let income = 0;
        let expenses = 0;
        for (const t of monthTrx) {
          const day = parseInt(t.date.split('-')[2], 10);
          if (day >= b.start && day <= b.end && t.scope === 'personal') {
            if (t.type === 'income') income += t.amount;
            else if (t.type === 'expense') expenses += t.amount;
          }
        }

        let revenue = 0;
        let profit = 0;
        for (const s of monthSales) {
          const day = parseInt(s.saleDate.split('-')[2], 10);
          if (day >= b.start && day <= b.end) {
            revenue += s.grossSales;
            profit += s.netProfit;
          }
        }

        return { name: b.label, income, expenses, revenue, profit };
      });

      return {
        chartData: data,
        periodLabel: `${formatMonthLabel(effectiveMonth)} • Weekly Breakdown`,
      };
    }

    if (dateFilter === 'year') {
      const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const yearTrx = transactions.filter((t) => t.date && t.date.startsWith(effectiveYear));
      const yearSales = allValidSales.filter((s) => s.saleDate && s.saleDate.startsWith(effectiveYear));

      const data = MONTH_NAMES.map((name, idx) => {
        const monthKey = `${effectiveYear}-${String(idx + 1).padStart(2, '0')}`;
        let income = 0;
        let expenses = 0;
        for (const t of yearTrx) {
          if (t.date && t.date.startsWith(monthKey) && t.scope === 'personal') {
            if (t.type === 'income') income += t.amount;
            else if (t.type === 'expense') expenses += t.amount;
          }
        }

        let revenue = 0;
        let profit = 0;
        for (const s of yearSales) {
          if (s.saleDate && s.saleDate.startsWith(monthKey)) {
            revenue += s.grossSales;
            profit += s.netProfit;
          }
        }

        return { name, income, expenses, revenue, profit };
      });

      return {
        chartData: data,
        periodLabel: `Year ${effectiveYear} • Monthly Breakdown`,
      };
    }

    const sortedYears = [...availableYears].sort();
    const data = sortedYears.map((yr) => {
      let income = 0;
      let expenses = 0;
      for (const t of transactions) {
        if (t.date && t.date.startsWith(yr) && t.scope === 'personal') {
          if (t.type === 'income') income += t.amount;
          else if (t.type === 'expense') expenses += t.amount;
        }
      }

      let revenue = 0;
      let profit = 0;
      for (const s of allValidSales) {
        if (s.saleDate && s.saleDate.startsWith(yr)) {
          revenue += s.grossSales;
          profit += s.netProfit;
        }
      }

      return { name: yr, income, expenses, revenue, profit };
    });

    return {
      chartData: data,
      periodLabel: 'All Time • Annual Breakdown',
    };
  }, [dateFilter, effectiveMonth, effectiveYear, availableYears, transactions, allValidSales]);

  if (!isLoaded) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const incomePeriodLabel =
    dateFilter === 'month' ? 'Monthly Income' : dateFilter === 'year' ? 'Annual Income' : 'All-Time Income';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Integrated overview of personal finances, business operations, and inventory."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Mode Selector */}
            <div className="inline-flex items-center gap-1 bg-secondary/40 backdrop-blur-xs p-1 rounded-xl text-xs font-medium border border-border/40">
              <button
                onClick={() => setDateFilter('month')}
                className={`px-3 py-1 rounded-lg transition-all duration-150 ${
                  dateFilter === 'month' ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setDateFilter('year')}
                className={`px-3 py-1 rounded-lg transition-all duration-150 ${
                  dateFilter === 'year' ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Year
              </button>
              <button
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1 rounded-lg transition-all duration-150 ${
                  dateFilter === 'all' ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Time
              </button>
            </div>

            {dateFilter === 'month' && (
              <select
                value={effectiveMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-8 rounded-xl border border-border/50 bg-card/60 px-3 text-xs text-foreground font-medium focus-visible:outline-none shadow-xs cursor-pointer"
                title="Select month to analyze"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthLabel(m)}
                  </option>
                ))}
              </select>
            )}

            {dateFilter === 'year' && (
              <select
                value={effectiveYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="h-8 rounded-xl border border-border/50 bg-card/60 px-3 text-xs text-foreground font-medium focus-visible:outline-none shadow-xs cursor-pointer"
                title="Select year to analyze"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            )}
          </div>
        }
      />

      <DashboardSummaryKpi
        totalCash={totalCashBalance}
        personalIncome={personalIncome}
        personalExpenses={personalExpenses}
        incomeLabel={incomePeriodLabel}
        businessRevenue={businessRevenue}
        businessNetProfit={businessNetProfit}
        availableStockCount={availableStockCount}
        inventoryCapitalValue={inventoryCapitalValue}
      />

      <AnalyticsCharts chartData={chartData} periodLabel={periodLabel} />

      <DonutDistributionCharts
        transactions={filteredTransactions}
        accounts={accounts}
        categories={categories}
      />

      <RecentActivity
        transactions={filteredTransactions.length > 0 ? filteredTransactions : transactions}
        lowStockProducts={lowStockProducts}
      />
    </div>
  );
}
