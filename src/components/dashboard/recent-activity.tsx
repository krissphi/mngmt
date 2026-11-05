'use client';

import React from 'react';
import Link from 'next/link';
import { formatIDR } from '@/lib/currency';
import { Product, Transaction } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface RecentActivityProps {
  transactions: Transaction[];
  lowStockProducts: Product[];
}

export function RecentActivity({ transactions, lowStockProducts }: RecentActivityProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 border-border/60 bg-card">
        <CardHeader className="flex flex-row items-center justify-between py-4 px-5 border-b border-border/60">
          <CardTitle className="text-sm font-semibold text-foreground">Recent Transactions</CardTitle>
          <Link href="/finance" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
            <span>General Ledger</span>
            <ArrowRight className="size-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border/60">
          {transactions.slice(0, 5).map((trx) => {
            const isIncome = trx.type === 'income';
            return (
              <div key={trx.id} className="flex items-center justify-between py-3 px-5 text-xs hover:bg-muted/20 transition-colors">
                <div>
                  <div className="font-medium text-foreground">{trx.description}</div>
                  <div className="text-[11px] text-muted-foreground">{trx.date} • {trx.scope}</div>
                </div>
                <div className={`font-semibold tabular-nums ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                  {isIncome ? '+' : '-'}{formatIDR(trx.amount)}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card">
        <CardHeader className="py-4 px-5 border-b border-border/60">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center justify-between">
            <span>Attention Required</span>
            {lowStockProducts.length > 0 && (
              <span className="text-[11px] font-medium text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                {lowStockProducts.length} Low Stock
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          {lowStockProducts.length === 0 ? (
            <p className="text-xs text-muted-foreground">All inventory items are currently at healthy stock levels.</p>
          ) : (
            lowStockProducts.slice(0, 3).map((prod) => (
              <div key={prod.id} className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-0">
                <span className="truncate max-w-[160px] font-medium text-foreground">{prod.name}</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">{prod.stockOnHand} pcs remaining</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
