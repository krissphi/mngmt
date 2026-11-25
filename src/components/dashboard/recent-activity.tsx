'use client';

import React from 'react';
import Link from 'next/link';
import { formatIDR } from '@/lib/currency';
import { Product, Transaction } from '@/types';
import { ArrowRight, AlertTriangle } from 'lucide-react';

interface RecentActivityProps {
  transactions: Transaction[];
  lowStockProducts: Product[];
}

export function RecentActivity({ transactions, lowStockProducts }: RecentActivityProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Recent Transactions (Clean Obsidian Card) */}
      <div className="lg:col-span-2 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <span className="text-sm font-semibold text-foreground">Recent Transactions</span>
          <Link
            href="/finance?tab=transactions"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        <div className="divide-y divide-border/40">
          {transactions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              No transactions recorded for this period.
            </p>
          ) : (
            transactions.slice(0, 5).map((trx) => {
              const isIncome = trx.type === 'income';
              const isTransfer = trx.type === 'transfer';
              return (
                <div
                  key={trx.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0 text-xs hover:bg-muted/30 rounded-lg px-1 transition-colors"
                >
                  <div>
                    <div className="font-medium text-foreground">{trx.description}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {trx.date} • <span className="capitalize">{trx.scope}</span>
                    </div>
                  </div>
                  <div
                    className={`font-semibold font-mono tabular-nums ${
                      isTransfer ? 'text-blue-400' : isIncome ? 'text-emerald-400' : 'text-foreground'
                    }`}
                  >
                    {isTransfer ? '⇄ ' : isIncome ? '+' : '-'}
                    {formatIDR(trx.amount)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Low Stock Alerts */}
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <span className="text-sm font-semibold text-foreground">Inventory Alerts</span>
          {lowStockProducts.length > 0 && (
            <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              {lowStockProducts.length} Low
            </span>
          )}
        </div>

        <div className="space-y-3">
          {lowStockProducts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              All inventory items are currently at healthy stock levels.
            </p>
          ) : (
            lowStockProducts.slice(0, 4).map((prod) => (
              <div
                key={prod.id}
                className="flex items-center justify-between text-xs py-2 border-b border-border/30 last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                  <span className="truncate font-medium text-foreground">{prod.name}</span>
                </div>
                <span className="text-amber-400 font-mono font-semibold shrink-0">
                  {prod.stockOnHand} left
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
