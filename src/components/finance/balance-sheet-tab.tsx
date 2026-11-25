'use client';

import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { useStore } from '@/context/store-context';
import { formatIDR } from '@/lib/currency';
import { isSellableProduct, isValidSale } from '@/lib/calculations';
import { resolveCategoryPair } from '@/lib/categories';
import { SummaryBanner } from '@/components/shared/summary-banner';
import { StatCard } from '@/components/shared/stat-card';
import {
  Wallet,
  Package,
  Sparkles,
  ShieldCheck,
  Printer,
  TrendingUp,
  CircleDollarSign,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function BalanceSheetTab() {
  const { accounts, products, assets, subscriptions, categories, sales, debts, savingsGoals } = useStore();

  const todayStr = useMemo(() => format(new Date(), 'MMMM d, yyyy'), []);

  // 1. Current Assets (Cash, Bank, E-Wallets + Savings Goals + Receivables/Escrow)
  const activeAccounts = useMemo(() => accounts.filter((a) => a.isActive), [accounts]);
  const totalCashAndBank = useMemo(
    () => activeAccounts.reduce((sum, a) => sum + a.balance, 0),
    [activeAccounts]
  );
  const totalSavingsGoals = useMemo(
    () => savingsGoals.reduce((sum, g) => sum + (g.currentAmount || 0), 0),
    [savingsGoals]
  );

  const pendingEscrowReceivables = useMemo(() => {
    return sales
      .filter((s) => isValidSale(s) && s.paymentStatus !== 'paid')
      .reduce((sum, s) => sum + Math.max(0, s.grossSales - s.marketplaceFees - s.discounts), 0);
  }, [sales]);

  const openDebtsReceivable = useMemo(() => {
    return debts
      .filter((d) => d.status !== 'settled' && d.direction === 'receivable')
      .reduce((sum, d) => sum + Math.max(0, d.totalAmount - d.paidAmount), 0);
  }, [debts]);

  const totalReceivables = pendingEscrowReceivables + openDebtsReceivable;

  // 2. Inventory Assets & Categorization (Single O(P) Pass)
  const { inventoryTotalValue, totalInventoryUnits, inventoryByCategory } = useMemo(() => {
    let totalVal = 0;
    let totalUnits = 0;
    const categoryGroupMap = new Map<string, { categoryName: string; skuCount: number; units: number; totalCost: number }>();

    for (const p of products) {
      if (!isSellableProduct(p)) continue;
      const itemCost = p.stockOnHand * p.purchaseCost;
      totalVal += itemCost;
      totalUnits += p.stockOnHand;

      const resolved = resolveCategoryPair(categories, p.categoryId, p.subCategoryId, 'General Goods');
      const catName = resolved.mainName;
      const entry = categoryGroupMap.get(catName) || { categoryName: catName, skuCount: 0, units: 0, totalCost: 0 };
      entry.skuCount += 1;
      entry.units += p.stockOnHand;
      entry.totalCost += itemCost;
      categoryGroupMap.set(catName, entry);
    }

    const grouped = Array.from(categoryGroupMap.values()).sort((a, b) => b.totalCost - a.totalCost);
    return {
      inventoryTotalValue: totalVal,
      totalInventoryUnits: totalUnits,
      inventoryByCategory: grouped,
    };
  }, [products, categories]);

  // 3. Personal & Collectible Assets
  const activeAssets = useMemo(
    () => assets.filter((a) => a.status === 'active'),
    [assets]
  );
  const totalAssetMarketValue = useMemo(
    () => activeAssets.reduce((sum, a) => sum + (a.currentEstimatedValue || 0), 0),
    [activeAssets]
  );
  const totalAssetCostValue = useMemo(
    () => activeAssets.reduce((sum, a) => sum + (a.purchasePrice || 0), 0),
    [activeAssets]
  );
  const assetUnrealizedGain = totalAssetMarketValue - totalAssetCostValue;

  // Group assets by main category
  const assetsByCategory = useMemo(() => {
    const map = new Map<string, { categoryName: string; count: number; cost: number; marketVal: number }>();
    activeAssets.forEach((a) => {
      const resolved = resolveCategoryPair(categories, a.categoryId, a.subCategoryId, a.category || 'General');
      const catName = resolved.mainName;
      const entry = map.get(catName) || { categoryName: catName, count: 0, cost: 0, marketVal: 0 };
      entry.count += 1;
      entry.cost += a.purchasePrice || 0;
      entry.marketVal += a.currentEstimatedValue || 0;
      map.set(catName, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.marketVal - a.marketVal);
  }, [activeAssets, categories]);

  // TOTAL ASSETS
  const totalAssets =
    totalCashAndBank + totalSavingsGoals + totalReceivables + inventoryTotalValue + totalAssetMarketValue;

  // 4. Liabilities (Open Payables + Monthly Recurring Commitments)
  const openPayables = useMemo(() => {
    return debts.filter((d) => d.status !== 'settled' && d.direction === 'payable');
  }, [debts]);
  const totalPayables = useMemo(
    () => openPayables.reduce((sum, d) => sum + Math.max(0, d.totalAmount - d.paidAmount), 0),
    [openPayables]
  );
  const activeSubs = useMemo(() => subscriptions.filter((s) => s.status === 'active'), [subscriptions]);
  const monthlySubscriptionLiabilities = useMemo(
    () => activeSubs.reduce((sum, s) => sum + (s.billingCycle === 'yearly' ? Math.round(s.amount / 12) : s.amount), 0),
    [activeSubs]
  );
  const totalLiabilities = totalPayables + monthlySubscriptionLiabilities;

  // 5. Net Worth / Owner's Equity (Total Assets - Liabilities)
  const netWorthEquity = totalAssets - totalLiabilities;

  // Asset Percentages
  const cashPercent = totalAssets > 0 ? (((totalCashAndBank + totalSavingsGoals + totalReceivables) / totalAssets) * 100).toFixed(1) : '0';
  const inventoryPercent = totalAssets > 0 ? ((inventoryTotalValue / totalAssets) * 100).toFixed(1) : '0';
  const collectiblesPercent = totalAssets > 0 ? ((totalAssetMarketValue / totalAssets) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <SummaryBanner
        label="Net Worth (Owner's Equity)"
        value={formatIDR(netWorthEquity)}
        meta={[
          `As of ${todayStr}`,
          `Assets ${formatIDR(totalAssets)}`,
          `Liabilities ${formatIDR(totalLiabilities)}`,
        ]}
        actions={
          <Button
            onClick={() => window.print()}
            variant="outline"
            size="sm"
            className="text-xs h-8.5 gap-1.5 rounded-lg border-border/60 print:hidden"
          >
            <Printer className="size-3.5" />
            <span>Print Statement</span>
          </Button>
        }
      />

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Assets"
          value={formatIDR(totalAssets)}
          icon={<CircleDollarSign className="size-4 text-primary" />}
          subtitle="Liquid, inventory & collectibles"
        />
        <StatCard
          title="Cash & Bank Liquidity"
          value={formatIDR(totalCashAndBank)}
          valueClassName="text-emerald-500"
          icon={<Wallet className="size-4 text-emerald-500" />}
          subtitle={`Liquidity share ${cashPercent}%`}
        />
        <StatCard
          title="Inventory Capital"
          value={formatIDR(inventoryTotalValue)}
          valueClassName="text-amber-500"
          icon={<Package className="size-4 text-amber-500" />}
          subtitle={`${totalInventoryUnits} units (${inventoryPercent}%)`}
        />
        <StatCard
          title="Total Liabilities"
          value={formatIDR(totalLiabilities)}
          valueClassName={totalLiabilities > 0 ? 'text-rose-500' : 'text-foreground'}
          icon={<ShieldCheck className="size-4 text-sky-500" />}
          subtitle="Open payables & monthly subs"
        />
      </div>

      {/* Asset Composition Visual Progress */}
      <Card className="border-border/60 bg-card">
        <CardContent className="p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Asset Composition Distribution</span>
            <span className="text-muted-foreground font-mono">100% Allocated</span>
          </div>

          <div className="h-3.5 w-full bg-muted rounded-full overflow-hidden flex">
            <div
              style={{ width: `${cashPercent}%` }}
              className="bg-emerald-500 hover:opacity-90 transition-all"
              title={`Cash, Savings & Receivables: ${formatIDR(totalCashAndBank + totalSavingsGoals + totalReceivables)} (${cashPercent}%)`}
            />
            <div
              style={{ width: `${inventoryPercent}%` }}
              className="bg-amber-500 hover:opacity-90 transition-all"
              title={`Business Inventory: ${formatIDR(inventoryTotalValue)} (${inventoryPercent}%)`}
            />
            <div
              style={{ width: `${collectiblesPercent}%` }}
              className="bg-indigo-500 hover:opacity-90 transition-all"
              title={`Personal Collectibles: ${formatIDR(totalAssetMarketValue)} (${collectiblesPercent}%)`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Cash, Savings &amp; Receivables ({cashPercent}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Business Inventory ({inventoryPercent}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-indigo-500" />
              <span className="text-muted-foreground">Personal Collectibles ({collectiblesPercent}%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed 2-Column Balance Sheet: Assets vs Liabilities & Equity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: ASSETS */}
        <div className="space-y-4">
          <div className="border border-border/70 rounded-xl overflow-hidden bg-card">
            <div className="bg-primary/5 px-4 py-3 border-b border-border/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Current Liquid Assets &amp; Receivables</h3>
              </div>
              <span className="text-xs font-bold text-foreground tabular-nums">{formatIDR(totalCashAndBank + totalSavingsGoals + totalReceivables)}</span>
            </div>
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-xs">Account / Institution</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs text-right">Current Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeAccounts.map((acc) => (
                  <TableRow key={acc.id} className="text-xs">
                    <TableCell className="font-medium text-foreground">
                      {acc.name}
                      {acc.institution ? <span className="text-muted-foreground font-normal ml-1">({acc.institution})</span> : null}
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">{acc.type.replace('_', ' ')}</TableCell>
                    <TableCell className="text-right font-semibold text-foreground tabular-nums">{formatIDR(acc.balance)}</TableCell>
                  </TableRow>
                ))}
                {totalSavingsGoals > 0 && (
                  <TableRow className="text-xs">
                    <TableCell className="font-medium text-foreground">Savings Goals Allocation ({savingsGoals.length} goals)</TableCell>
                    <TableCell className="text-muted-foreground">Savings</TableCell>
                    <TableCell className="text-right font-semibold text-sky-400 tabular-nums">{formatIDR(totalSavingsGoals)}</TableCell>
                  </TableRow>
                )}
                {pendingEscrowReceivables > 0 && (
                  <TableRow className="text-xs">
                    <TableCell className="font-medium text-foreground">Marketplace Escrow (Unsettled Sales)</TableCell>
                    <TableCell className="text-muted-foreground">Receivable</TableCell>
                    <TableCell className="text-right font-semibold text-amber-500 tabular-nums">{formatIDR(pendingEscrowReceivables)}</TableCell>
                  </TableRow>
                )}
                {openDebtsReceivable > 0 && (
                  <TableRow className="text-xs">
                    <TableCell className="font-medium text-foreground">Open Receivables (Piutang)</TableCell>
                    <TableCell className="text-muted-foreground">Receivable</TableCell>
                    <TableCell className="text-right font-semibold text-emerald-500 tabular-nums">{formatIDR(openDebtsReceivable)}</TableCell>
                  </TableRow>
                )}
                <TableRow className="bg-muted/20 font-bold text-xs">
                  <TableCell colSpan={2}>Subtotal Liquid, Savings &amp; Receivables</TableCell>
                  <TableCell className="text-right text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatIDR(totalCashAndBank + totalSavingsGoals + totalReceivables)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Business Inventory */}
          <div className="border border-border/70 rounded-xl overflow-hidden bg-card">
            <div className="bg-amber-500/5 px-4 py-3 border-b border-border/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="size-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Business Inventory</h3>
              </div>
              <span className="text-xs font-bold text-foreground tabular-nums">{formatIDR(inventoryTotalValue)}</span>
            </div>
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-xs">Product Category</TableHead>
                  <TableHead className="text-xs text-center">SKUs / Units</TableHead>
                  <TableHead className="text-xs text-right">Cost Valuation (COGS)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryByCategory.map((cat) => (
                  <TableRow key={cat.categoryName} className="text-xs">
                    <TableCell className="font-medium text-foreground">{cat.categoryName}</TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {cat.skuCount} SKU / {cat.units} units
                    </TableCell>
                    <TableCell className="text-right font-semibold text-foreground tabular-nums">{formatIDR(cat.totalCost)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/20 font-bold text-xs">
                  <TableCell colSpan={2}>Subtotal Inventory ({totalInventoryUnits} units)</TableCell>
                  <TableCell className="text-right text-amber-600 dark:text-amber-400 tabular-nums">
                    {formatIDR(inventoryTotalValue)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Personal Collectibles */}
          <div className="border border-border/70 rounded-xl overflow-hidden bg-card">
            <div className="bg-indigo-500/5 px-4 py-3 border-b border-border/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Personal Asset Portfolio</h3>
              </div>
              <span className="text-xs font-bold text-foreground tabular-nums">{formatIDR(totalAssetMarketValue)}</span>
            </div>
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-xs">Asset Category</TableHead>
                  <TableHead className="text-xs text-right">Purchase Cost</TableHead>
                  <TableHead className="text-xs text-right">Market Estimate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assetsByCategory.map((cat) => (
                  <TableRow key={cat.categoryName} className="text-xs">
                    <TableCell className="font-medium text-foreground">
                      {cat.categoryName} ({cat.count} items)
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">{formatIDR(cat.cost)}</TableCell>
                    <TableCell className="text-right font-semibold text-foreground tabular-nums">{formatIDR(cat.marketVal)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/20 font-bold text-xs">
                  <TableCell>Subtotal Personal Assets</TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">{formatIDR(totalAssetCostValue)}</TableCell>
                  <TableCell className="text-right text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {formatIDR(totalAssetMarketValue)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            {assetUnrealizedGain !== 0 && (
              <div className="p-3 bg-muted/20 text-xs border-t border-border/50 flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="size-3.5 text-emerald-500" />
                  Unrealized Gain / Value Appreciation:
                </span>
                <span className={`font-semibold tabular-nums ${assetUnrealizedGain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                  {assetUnrealizedGain >= 0 ? '+' : ''}{formatIDR(assetUnrealizedGain)}
                </span>
              </div>
            )}
          </div>

          {/* TOTAL ASSETS BAR */}
          <div className="p-4 rounded-2xl border border-primary/40 bg-primary/5 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-primary">Total Assets Portfolio</div>
              <div className="text-[11px] text-muted-foreground">Cash + Business Inventory + Personal Assets</div>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-foreground tabular-nums shrink-0">{formatIDR(totalAssets)}</div>
          </div>
        </div>

        {/* Right Column: LIABILITIES & EQUITY */}
        <div className="space-y-4">
          {/* Liabilities */}
          <div className="border border-border/70 rounded-xl overflow-hidden bg-card">
            <div className="bg-rose-500/5 px-4 py-3 border-b border-border/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 text-rose-600 dark:text-rose-400" />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Recurring Liabilities</h3>
              </div>
              <span className="text-xs font-bold text-foreground tabular-nums">{formatIDR(totalLiabilities)}</span>
            </div>
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-xs">Active Recurring Commitment</TableHead>
                  <TableHead className="text-xs">Cycle</TableHead>
                  <TableHead className="text-xs text-right">Monthly Equivalent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openPayables.map((debt) => (
                  <TableRow key={debt.id} className="text-xs">
                    <TableCell className="font-medium text-foreground">
                      {debt.title} <span className="text-muted-foreground font-normal">({debt.counterparty})</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">Payable</TableCell>
                    <TableCell className="text-right text-rose-600 dark:text-rose-400 font-semibold tabular-nums">
                      {formatIDR(Math.max(0, debt.totalAmount - debt.paidAmount))}
                    </TableCell>
                  </TableRow>
                ))}
                {activeSubs.length > 0 ? (
                  activeSubs.map((sub) => (
                    <TableRow key={sub.id} className="text-xs">
                      <TableCell className="font-medium text-foreground">{sub.name}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">{sub.billingCycle.replace('_', ' ')}</TableCell>
                      <TableCell className="text-right text-rose-600 dark:text-rose-400 font-semibold tabular-nums">
                        {formatIDR(sub.billingCycle === 'yearly' ? Math.round(sub.amount / 12) : sub.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : openPayables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-xs text-muted-foreground text-center py-4">
                      No recurring commitments or payables recorded.
                    </TableCell>
                  </TableRow>
                ) : null}
                <TableRow className="bg-muted/20 font-bold text-xs">
                  <TableCell colSpan={2}>Subtotal Liabilities</TableCell>
                  <TableCell className="text-right text-rose-600 dark:text-rose-400 tabular-nums">
                    {formatIDR(totalLiabilities)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Owner Equity */}
          <div className="border border-border/70 rounded-xl overflow-hidden bg-card">
            <div className="bg-blue-500/5 px-4 py-3 border-b border-border/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Net Owner&apos;s Equity</h3>
              </div>
              <span className="text-xs font-bold text-foreground tabular-nums">{formatIDR(netWorthEquity)}</span>
            </div>
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-xs">Equity Component</TableHead>
                  <TableHead className="text-xs text-right">Share</TableHead>
                  <TableHead className="text-xs text-right">Equity Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="text-xs">
                  <TableCell className="font-medium text-foreground">Liquid Cash, Savings &amp; Receivables</TableCell>
                  <TableCell className="text-right text-muted-foreground">{cashPercent}%</TableCell>
                  <TableCell className="text-right font-semibold text-foreground tabular-nums">{formatIDR(totalCashAndBank + totalSavingsGoals + totalReceivables)}</TableCell>
                </TableRow>
                <TableRow className="text-xs">
                  <TableCell className="font-medium text-foreground">Capital in Merchandise Inventory</TableCell>
                  <TableCell className="text-right text-muted-foreground">{inventoryPercent}%</TableCell>
                  <TableCell className="text-right font-semibold text-foreground tabular-nums">{formatIDR(inventoryTotalValue)}</TableCell>
                </TableRow>
                <TableRow className="text-xs">
                  <TableCell className="font-medium text-foreground">Personal Collectibles Portfolio Value</TableCell>
                  <TableCell className="text-right text-muted-foreground">{collectiblesPercent}%</TableCell>
                  <TableCell className="text-right font-semibold text-foreground tabular-nums">{formatIDR(totalAssetMarketValue)}</TableCell>
                </TableRow>
                {totalLiabilities > 0 && (
                  <TableRow className="text-xs text-rose-600 dark:text-rose-400">
                    <TableCell className="font-medium">Less Recurring Commitments</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">-{formatIDR(totalLiabilities)}</TableCell>
                  </TableRow>
                )}
                <TableRow className="bg-muted/20 font-bold text-xs">
                  <TableCell colSpan={2}>Total Net Equity</TableCell>
                  <TableCell className="text-right text-blue-600 dark:text-blue-400 tabular-nums">
                    {formatIDR(netWorthEquity)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* TOTAL LIABILITIES + EQUITY BAR (BALANCING EQUATION) */}
          <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400">
                Total Liabilities & Net Equity
              </div>
              <div className="text-[11px] text-muted-foreground">Liabilities + Net Equity = Balanced Equation</div>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-foreground tabular-nums shrink-0">
              {formatIDR(totalLiabilities + netWorthEquity)}
            </div>
          </div>

          {/* Financial Health Summary Note */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              Financial Health Overview
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Your balance sheet demonstrates strong solvency with total assets exceeding liabilities.
              Cash liquidity reserve stands at <b>{cashPercent}%</b> of total assets, maintaining a safe buffer
              for daily operations and inventory acquisitions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
