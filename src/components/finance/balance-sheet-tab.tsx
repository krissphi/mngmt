'use client';

import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { useStore } from '@/context/store-context';
import { formatIDR } from '@/lib/currency';
import {
  Wallet,
  Package,
  Sparkles,
  ShieldCheck,
  Printer,
  TrendingUp,
  Scale,
  CircleDollarSign,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function BalanceSheetTab() {
  const { accounts, products, assets, subscriptions, categories } = useStore();

  const todayStr = useMemo(() => format(new Date(), 'MMMM d, yyyy'), []);

  // 1. Current Assets (Cash, Bank, E-Wallets)
  const activeAccounts = useMemo(() => accounts.filter((a) => a.isActive), [accounts]);
  const totalCashAndBank = useMemo(
    () => activeAccounts.reduce((sum, a) => sum + a.balance, 0),
    [activeAccounts]
  );

  // 2. Inventory Assets & Categorization (Single O(P) Pass)
  const { inventoryTotalValue, totalInventoryUnits, inventoryByCategory } = useMemo(() => {
    let totalVal = 0;
    let totalUnits = 0;
    const catMap = new Map(categories.map((c) => [c.id, c.name]));
    const categoryGroupMap = new Map<string, { categoryName: string; skuCount: number; units: number; totalCost: number }>();

    for (const p of products) {
      if (p.productType === 'asset' || p.productType === 'personal_collection') continue;
      const itemCost = p.stockOnHand * p.purchaseCost;
      totalVal += itemCost;
      totalUnits += p.stockOnHand;

      const catName = (p.categoryId ? catMap.get(p.categoryId) : undefined) || 'General Goods';
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

  // Group assets by category
  const assetsByCategory = useMemo(() => {
    const map = new Map<string, { categoryName: string; count: number; cost: number; marketVal: number }>();
    activeAssets.forEach((a) => {
      const catName = (a.categoryId ? categories.find((c) => c.id === a.categoryId)?.name : undefined) || a.category || 'General';
      const entry = map.get(catName) || { categoryName: catName, count: 0, cost: 0, marketVal: 0 };
      entry.count += 1;
      entry.cost += a.purchasePrice || 0;
      entry.marketVal += a.currentEstimatedValue || 0;
      map.set(catName, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.marketVal - a.marketVal);
  }, [activeAssets, categories]);

  // TOTAL ASSETS
  const totalAssets = totalCashAndBank + inventoryTotalValue + totalAssetMarketValue;

  // 4. Liabilities (Short-Term Commitments / Active recurring subscriptions for the month)
  const activeSubs = useMemo(() => subscriptions.filter((s) => s.status === 'active'), [subscriptions]);
  const monthlySubscriptionLiabilities = useMemo(
    () => activeSubs.reduce((sum, s) => sum + (s.billingCycle === 'yearly' ? Math.round(s.amount / 12) : s.amount), 0),
    [activeSubs]
  );
  const totalLiabilities = monthlySubscriptionLiabilities;

  // 5. Net Worth / Owner's Equity (Total Assets - Liabilities)
  const netWorthEquity = totalAssets - totalLiabilities;

  // Asset Percentages
  const cashPercent = totalAssets > 0 ? ((totalCashAndBank / totalAssets) * 100).toFixed(1) : '0';
  const inventoryPercent = totalAssets > 0 ? ((inventoryTotalValue / totalAssets) * 100).toFixed(1) : '0';
  const collectiblesPercent = totalAssets > 0 ? ((totalAssetMarketValue / totalAssets) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header Actions & Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/30 rounded-xl border border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="size-4.5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Balance Sheet Statement</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Statement of liquid assets, business inventory value, and personal assets as of <b>{todayStr}</b>.
          </p>
        </div>
        <Button
          onClick={() => window.print()}
          variant="outline"
          size="sm"
          className="text-xs h-8 gap-1.5 self-start sm:self-auto"
        >
          <Printer className="size-3.5" />
          <span>Print Statement</span>
        </Button>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assets */}
        <Card className="border-border/60 bg-card shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Assets</span>
              <div className="size-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <CircleDollarSign className="size-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-2">{formatIDR(totalAssets)}</div>
            <div className="text-[11px] text-muted-foreground mt-1">All liquid cash, inventory & personal assets</div>
          </CardContent>
        </Card>

        {/* Liquid Cash */}
        <Card className="border-border/60 bg-card shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Cash & Bank Liquidity</span>
              <div className="size-7 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Wallet className="size-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
              {formatIDR(totalCashAndBank)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Liquidity ratio: <b className="text-foreground">{cashPercent}%</b>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Capital */}
        <Card className="border-border/60 bg-card shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Business Inventory Capital</span>
              <div className="size-7 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Package className="size-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
              {formatIDR(inventoryTotalValue)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {totalInventoryUnits} units in stock ({inventoryPercent}%)
            </div>
          </CardContent>
        </Card>

        {/* Net Worth / Equity */}
        <Card className="border-border/60 bg-card shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Net Worth (Owner&apos;s Equity)</span>
              <div className="size-7 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ShieldCheck className="size-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-2">{formatIDR(netWorthEquity)}</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              Net assets minus recurring liabilities
            </div>
          </CardContent>
        </Card>
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
              title={`Cash & Bank: ${formatIDR(totalCashAndBank)} (${cashPercent}%)`}
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
              <span className="text-muted-foreground">Cash & Bank ({cashPercent}%)</span>
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
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Current Liquid Assets</h3>
              </div>
              <span className="text-xs font-bold text-foreground tabular-nums">{formatIDR(totalCashAndBank)}</span>
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
                <TableRow className="bg-muted/20 font-bold text-xs">
                  <TableCell colSpan={2}>Subtotal Cash & Bank</TableCell>
                  <TableCell className="text-right text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatIDR(totalCashAndBank)}
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
          <div className="p-4 rounded-xl border-2 border-primary/40 bg-primary/5 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-primary">Total Assets Portfolio</div>
              <div className="text-[11px] text-muted-foreground">Cash + Business Inventory + Personal Assets</div>
            </div>
            <div className="text-xl font-extrabold text-foreground tabular-nums">{formatIDR(totalAssets)}</div>
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
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-xs text-muted-foreground text-center py-4">
                      No recurring liabilities or debt recorded.
                    </TableCell>
                  </TableRow>
                )}
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
                  <TableCell className="font-medium text-foreground">Liquid Cash & Bank Reserves</TableCell>
                  <TableCell className="text-right text-muted-foreground">{cashPercent}%</TableCell>
                  <TableCell className="text-right font-semibold text-foreground tabular-nums">{formatIDR(totalCashAndBank)}</TableCell>
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
          <div className="p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400">
                Total Liabilities & Net Equity
              </div>
              <div className="text-[11px] text-muted-foreground">Liabilities + Net Equity = Balanced Equation</div>
            </div>
            <div className="text-xl font-extrabold text-foreground tabular-nums">
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
