'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { formatIDR } from '@/lib/currency';
import { getLocalMonthString } from '@/lib/date';
import { getAvailableStock, isSellableProduct, isValidSale } from '@/lib/calculations';
import { SummaryBanner } from '@/components/shared/summary-banner';
import { StatCard } from '@/components/shared/stat-card';
import { ShoppingBag, AlertTriangle, Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuickActionModal } from '@/components/shared/quick-action-modal';

export function BusinessSummaryTab() {
  const { sales, products } = useStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'all'>('month');
  const [currentMonth] = useState(() => getLocalMonthString());
  const [quickModalOpen, setQuickModalOpen] = useState(false);

  const validSales = useMemo(() => sales.filter(isValidSale), [sales]);

  const targetSales = useMemo(() => {
    if (selectedPeriod === 'all') return validSales;
    return validSales.filter((s) => s.saleDate.startsWith(currentMonth));
  }, [validSales, selectedPeriod, currentMonth]);

  const { revenue, netProfit, pendingSettlement, unsettledCount } = useMemo(() => {
    let rev = 0;
    let profit = 0;
    let unpaid = 0;
    let unpaidCount = 0;
    for (const s of targetSales) {
      rev += s.grossSales;
      profit += s.netProfit;
      if (s.paymentStatus !== 'paid') {
        unpaid += Math.max(0, s.grossSales - s.marketplaceFees - s.discounts);
        unpaidCount++;
      }
    }
    return {
      revenue: rev,
      netProfit: profit,
      pendingSettlement: unpaid,
      unsettledCount: unpaidCount,
    };
  }, [targetSales]);

  const sellableProducts = useMemo(() => products.filter(isSellableProduct), [products]);
  const activeSellableProducts = useMemo(
    () => sellableProducts.filter((p) => p.status !== 'archived'),
    [sellableProducts]
  );

  const { availableStockCount, inventoryCostCapital } = useMemo(() => {
    let units = 0;
    let capital = 0;
    for (const p of activeSellableProducts) {
      units += getAvailableStock(p);
      capital += (p.stockOnHand || 0) * (p.purchaseCost || 0);
    }
    return { availableStockCount: units, inventoryCostCapital: capital };
  }, [activeSellableProducts]);

  const channelBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    targetSales.forEach((s) => {
      map.set(s.channel, (map.get(s.channel) || 0) + s.grossSales);
    });
    return Array.from(map.entries()).map(([channel, total]) => ({ channel, total }));
  }, [targetSales]);

  const lowStockItems = useMemo(() => {
    return activeSellableProducts.filter((p) => p.stockOnHand <= p.minStockAlert);
  }, [activeSellableProducts]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; sku: string; units: number; revenue: number; profit: number }>();
    for (const s of targetSales) {
      for (const item of s.items) {
        const entry = map.get(item.productId) || {
          name: item.productName,
          sku: item.sku,
          units: 0,
          revenue: 0,
          profit: 0,
        };
        entry.units += item.quantity;
        entry.revenue += item.subtotal;
        entry.profit += item.grossProfit;
        map.set(item.productId, entry);
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 4);
  }, [targetSales]);

  const marginPct = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0;

  return (
    <div className="space-y-6">
      <SummaryBanner
        label={`Gross Seller Revenue (${selectedPeriod === 'month' ? currentMonth : 'All Time'})`}
        value={formatIDR(revenue)}
        meta={[
          `${targetSales.length} Valid ${targetSales.length === 1 ? 'Order' : 'Orders'}`,
          `Net Profit ${formatIDR(netProfit)} (${marginPct}%)`,
          `${activeSellableProducts.length} Active SKUs`,
        ]}
        actions={
          <>
            <div className="inline-flex p-0.5 bg-secondary/40 backdrop-blur-xs rounded-xl border border-border/40 gap-0.5">
              <button
                onClick={() => setSelectedPeriod('month')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedPeriod === 'month'
                    ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setSelectedPeriod('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedPeriod === 'all'
                    ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Time
              </button>
            </div>

            <Button
              onClick={() => setQuickModalOpen(true)}
              size="sm"
              className="text-xs h-8.5 px-3 rounded-lg gap-1.5 bg-foreground text-background hover:bg-foreground/90 font-medium shadow-sm"
            >
              <Plus className="size-3.5" />
              <span>Record Sale</span>
            </Button>
          </>
        }
      />

      {/* 4 Seller KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Estimated Net Profit"
          value={formatIDR(netProfit)}
          valueClassName={netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}
          subtitle={`Profit margin ${marginPct}%`}
        />
        <StatCard
          title="Pending Escrow"
          value={formatIDR(pendingSettlement)}
          valueClassName={pendingSettlement > 0 ? 'text-amber-500' : 'text-foreground'}
          subtitle={
            unsettledCount > 0
              ? `${unsettledCount} unsettled ${unsettledCount === 1 ? 'order' : 'orders'}`
              : 'All orders settled'
          }
        />
        <StatCard
          title="Available Store Stock"
          value={`${availableStockCount} units`}
          subtitle={`${activeSellableProducts.length} active SKUs`}
        />
        <StatCard
          title="Inventory Cost Capital"
          value={formatIDR(inventoryCostCapital)}
          subtitle="Current stock COGS basis"
        />
      </div>

      {/* Channel Breakdown, Top SKUs & Low Stock Alert */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <span className="text-sm font-semibold text-foreground">Revenue by Channel</span>
          </div>
          <div className="space-y-3">
            {channelBreakdown.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No active sales in this period.</p>
            ) : (
              channelBreakdown.map((item) => {
                const pct = revenue > 0 ? Math.round((item.total / revenue) * 100) : 0;

                return (
                  <div key={item.channel} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <ShoppingBag className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="font-semibold uppercase text-foreground">{item.channel}</span>
                      </div>
                      <span className="font-semibold font-mono tabular-nums text-foreground shrink-0">
                        {formatIDR(item.total)}
                      </span>
                    </div>
                    <div className="w-full bg-secondary/50 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-full transition-all duration-300 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <TrendingUp className="size-4 text-emerald-500" />
              Top Profitable SKUs
            </span>
          </div>
          <div className="space-y-2.5">
            {topProducts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No SKU sales recorded yet.</p>
            ) : (
              topProducts.map((tp) => (
                <div key={tp.sku || tp.name} className="flex items-center justify-between gap-2 text-xs py-1 border-b border-border/40 last:border-0">
                  <div className="min-w-0 pr-2">
                    <div className="font-medium text-foreground truncate">{tp.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{tp.units} sold</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold font-mono tabular-nums text-emerald-500">+{formatIDR(tp.profit)}</div>
                    <div className="text-[10px] text-muted-foreground font-mono tabular-nums">Rev {formatIDR(tp.revenue)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <span className="text-sm font-semibold text-foreground">Low Stock Warnings</span>
            <span className="text-xs text-muted-foreground font-mono">
              {lowStockItems.length} low
            </span>
          </div>
          <div className="space-y-2.5">
            {lowStockItems.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">All product stocks are at healthy levels.</p>
            ) : (
              lowStockItems.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 text-xs py-1 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">{p.name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">{p.sku}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold font-mono text-amber-500">{p.stockOnHand} pcs</span>
                    <div className="text-[10px] text-muted-foreground font-mono">Min {p.minStockAlert}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <QuickActionModal
        open={quickModalOpen}
        onOpenChange={setQuickModalOpen}
        defaultTab="sale"
      />
    </div>
  );
}
