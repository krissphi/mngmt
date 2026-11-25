'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { formatIDR } from '@/lib/currency';
import { isValidSale } from '@/lib/calculations';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { SummaryBanner } from '@/components/shared/summary-banner';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { DataExportCard } from '@/components/reports/data-export-card';
import { DataImportCard } from '@/components/reports/data-import-card';

export default function ReportsPage() {
  const { sales } = useStore();
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((s) => s.saleDate && set.add(s.saleDate.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [sales]);

  const filteredSales = useMemo(() => {
    const valid = sales.filter(isValidSale);
    if (selectedMonth === 'all') return valid;
    return valid.filter((s) => s.saleDate.startsWith(selectedMonth));
  }, [sales, selectedMonth]);

  const { totalRevenue, totalFees, totalProfit } = useMemo(() => {
    let rev = 0;
    let fees = 0;
    let profit = 0;
    for (const s of filteredSales) {
      rev += s.grossSales;
      fees += s.marketplaceFees;
      profit += s.netProfit;
    }
    return { totalRevenue: rev, totalFees: fees, totalProfit: profit };
  }, [filteredSales]);

  const channels = ['shopee', 'tiktok', 'tokopedia', 'direct', 'other'];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Export/Import financial data (CSV or Excel) and analyze multichannel sales."
        action={
          <Button onClick={() => window.print()} variant="outline" size="sm" className="text-xs h-8.5 rounded-lg border-border/60">
            <Printer className="size-3.5 mr-1.5" />
            <span>Print Report</span>
          </Button>
        }
      />

      {/* Unified Data Management: Export & Import */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DataExportCard />
        <DataImportCard />
      </div>

      {/* Multichannel Sales Summary Banner */}
      <SummaryBanner
        label={`Multichannel Revenue (${selectedMonth === 'all' ? 'All Time' : selectedMonth})`}
        value={formatIDR(totalRevenue)}
        meta={[
          `${filteredSales.length} Valid Orders`,
          `Fees -${formatIDR(totalFees)}`,
          `Net Profit ${formatIDR(totalProfit)}`,
        ]}
        actions={
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-8.5 rounded-lg border border-border/60 bg-card/60 px-2.5 text-xs text-foreground focus-visible:outline-none print:hidden"
            aria-label="Filter report period"
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

      {/* Multichannel Performance Table */}
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-b border-border/60">
              <TableHead className="w-12 text-center text-xs font-semibold text-muted-foreground uppercase py-3 px-3">
                #
              </TableHead>
              <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground uppercase">
                Channel
              </TableHead>
              <TableHead className="py-3 px-5 text-center text-xs font-semibold text-muted-foreground uppercase">
                Orders
              </TableHead>
              <TableHead className="py-3 px-5 text-right text-xs font-semibold text-muted-foreground uppercase">
                Gross Sales
              </TableHead>
              <TableHead className="py-3 px-5 text-right text-xs font-semibold text-muted-foreground uppercase">
                Marketplace Fees
              </TableHead>
              <TableHead className="py-3 px-5 text-right text-xs font-semibold text-muted-foreground uppercase">
                Net Profit
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/60">
            {channels.map((ch, idx) => {
              const chSales = filteredSales.filter((s) => s.channel === ch);
              const orders = chSales.length;
              const omzet = chSales.reduce((sum, s) => sum + s.grossSales, 0);
              const fees = chSales.reduce((sum, s) => sum + s.marketplaceFees, 0);
              const profit = chSales.reduce((sum, s) => sum + s.netProfit, 0);

              return (
                <TableRow key={ch} className="text-xs hover:bg-muted/20 transition-colors">
                  <TableCell className="text-center font-mono text-xs text-muted-foreground py-3 px-3">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="px-5 py-3 font-semibold uppercase text-primary">
                    {ch === 'direct' ? 'Direct / Offline' : ch}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-center font-mono tabular-nums">
                    {orders}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-right font-medium font-mono text-foreground tabular-nums">
                    {formatIDR(omzet)}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-right text-rose-500 font-medium font-mono tabular-nums">
                    -{formatIDR(fees)}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-right font-bold font-mono text-emerald-500 tabular-nums">
                    {formatIDR(profit)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
