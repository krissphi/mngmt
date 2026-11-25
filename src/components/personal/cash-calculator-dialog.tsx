'use client';

import React, { useState, useMemo } from 'react';
import { Account, CashBreakdown } from '@/types';
import { useStore } from '@/context/store-context';
import { formatIDR, formatSignedIDR } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Banknote, Coins, Plus, Minus, RotateCcw, CheckCircle2 } from 'lucide-react';

interface CashCalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
}

export const RUPIAH_DENOMINATIONS = [
  { value: 100000, label: 'Rp 100.000', dotColor: 'bg-rose-500', type: 'Banknote' as const },
  { value: 50000, label: 'Rp 50.000', dotColor: 'bg-blue-500', type: 'Banknote' as const },
  { value: 20000, label: 'Rp 20.000', dotColor: 'bg-emerald-500', type: 'Banknote' as const },
  { value: 10000, label: 'Rp 10.000', dotColor: 'bg-purple-500', type: 'Banknote' as const },
  { value: 5000, label: 'Rp 5.000', dotColor: 'bg-amber-500', type: 'Banknote' as const },
  { value: 2000, label: 'Rp 2.000', dotColor: 'bg-stone-400', type: 'Banknote' as const },
  { value: 1000, label: 'Rp 1.000', dotColor: 'bg-teal-500', type: 'Banknote' as const },
  { value: 500, label: 'Rp 500', dotColor: 'bg-slate-400', type: 'Coin' as const },
  { value: 200, label: 'Rp 200', dotColor: 'bg-slate-400', type: 'Coin' as const },
  { value: 100, label: 'Rp 100', dotColor: 'bg-slate-400', type: 'Coin' as const },
];

const BANKNOTE_ITEMS = RUPIAH_DENOMINATIONS.filter((d) => d.type === 'Banknote');
const COIN_ITEMS = RUPIAH_DENOMINATIONS.filter((d) => d.type === 'Coin');

function buildInitialBreakdown(account: Account | null): CashBreakdown {
  const initial: CashBreakdown = {};
  RUPIAH_DENOMINATIONS.forEach((d) => {
    initial[d.value] = account?.cashBreakdown?.[d.value] ?? 0;
  });
  return initial;
}

export function CashCalculatorDialog({ open, onOpenChange, account }: CashCalculatorDialogProps) {
  const { updateCashBreakdown } = useStore();

  const [prevKey, setPrevKey] = useState<string>('');
  const [breakdown, setBreakdown] = useState<CashBreakdown>(() => buildInitialBreakdown(account));
  const [recordAdjustment, setRecordAdjustment] = useState(true);

  const syncKey = `${open}-${account?.id || ''}`;
  if (syncKey !== prevKey) {
    setPrevKey(syncKey);
    if (open) {
      setBreakdown(buildInitialBreakdown(account));
      setRecordAdjustment(true);
    }
  }

  const handleSetCount = (value: number, raw: string) => {
    const parsed = raw === '' ? 0 : parseInt(raw, 10);
    const validCount = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
    setBreakdown((prev) => ({
      ...prev,
      [value]: validCount,
    }));
  };

  const handleAdjustCount = (value: number, delta: number) => {
    setBreakdown((prev) => ({
      ...prev,
      [value]: Math.max(0, (prev[value] || 0) + delta),
    }));
  };

  const handleReset = () => {
    const cleared: CashBreakdown = {};
    RUPIAH_DENOMINATIONS.forEach((d) => {
      cleared[d.value] = 0;
    });
    setBreakdown(cleared);
  };

  const { calculatedTotal, banknoteTotal, coinTotal, totalPieces } = useMemo(() => {
    let banknotes = 0;
    let coins = 0;
    let pieces = 0;
    for (const denom of RUPIAH_DENOMINATIONS) {
      const qty = Math.max(0, Number(breakdown[denom.value]) || 0);
      const sub = denom.value * qty;
      pieces += qty;
      if (denom.type === 'Banknote') banknotes += sub;
      else coins += sub;
    }
    return {
      calculatedTotal: banknotes + coins,
      banknoteTotal: banknotes,
      coinTotal: coins,
      totalPieces: pieces,
    };
  }, [breakdown]);

  const currentBalance = account?.balance || 0;
  const difference = calculatedTotal - currentBalance;

  const handleSave = () => {
    if (!account) return;
    updateCashBreakdown(account.id, breakdown, {
      recordAdjustment: difference !== 0 && recordAdjustment,
    });
    onOpenChange(false);
  };

  const renderRows = (items: typeof RUPIAH_DENOMINATIONS) => (
    <div className="space-y-1.5">
      {items.map((denom) => {
        const count = breakdown[denom.value] || 0;
        const subtotal = denom.value * count;

        return (
          <div
            key={denom.value}
            className={`grid grid-cols-[minmax(100px,1fr)_124px_minmax(95px,auto)] items-center gap-2 sm:gap-3 px-3 py-2 rounded-xl border transition-colors ${
              count > 0
                ? 'border-primary/30 bg-primary/[0.04]'
                : 'border-border/50 bg-card/50 hover:bg-muted/20'
            }`}
          >
            {/* Denomination */}
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`w-1.5 h-5 rounded-full shrink-0 ${denom.dotColor}`} />
              <span className="text-xs font-mono font-semibold text-foreground whitespace-nowrap">
                {denom.label}
              </span>
            </div>

            {/* Stepper Controls */}
            <div className="flex items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAdjustCount(denom.value, -1)}
                disabled={count <= 0}
                className="size-7 rounded-lg border border-border/70 bg-muted/40 hover:bg-muted disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-foreground transition-colors"
                aria-label={`Decrease ${denom.label}`}
              >
                <Minus className="size-3.5" />
              </button>

              <Input
                type="number"
                min={0}
                value={count === 0 ? '' : count}
                placeholder="0"
                onChange={(e) => handleSetCount(denom.value, e.target.value)}
                className="w-13 h-7 text-center font-mono font-bold text-xs px-1 bg-background/80 tabular-nums"
                aria-label={`Count for ${denom.label}`}
              />

              <button
                type="button"
                onClick={() => handleAdjustCount(denom.value, 1)}
                className="size-7 rounded-lg border border-border/70 bg-muted/40 hover:bg-muted flex items-center justify-center text-foreground transition-colors"
                aria-label={`Increase ${denom.label}`}
              >
                <Plus className="size-3.5" />
              </button>
            </div>

            {/* Subtotal */}
            <div className="text-right">
              <span
                className={`text-xs font-mono tabular-nums whitespace-nowrap ${
                  subtotal > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground/50'
                }`}
              >
                {formatIDR(subtotal)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl sm:max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
        {/* Header */}
        <DialogHeader className="px-5 py-4 pr-12 border-b border-border/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
              <Banknote className="size-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold text-foreground truncate">
                Cash Breakdown — {account?.name || 'Cash Pocket'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Count physical banknotes and coins to reconcile your cash wallet.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Live Comparison Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-5 py-3 bg-muted/25 border-b border-border/60 shrink-0 text-xs">
          <div className="rounded-lg bg-card/70 border border-border/50 px-3 py-2 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Current Balance
            </div>
            <div className="text-xs sm:text-sm font-mono font-semibold text-foreground mt-0.5 tabular-nums break-words">
              {formatIDR(currentBalance)}
            </div>
          </div>
          <div className="rounded-lg bg-card/70 border border-border/50 px-3 py-2 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Counted ({totalPieces} pcs)
            </div>
            <div className="text-xs sm:text-sm font-mono font-bold text-emerald-500 mt-0.5 tabular-nums break-words">
              {formatIDR(calculatedTotal)}
            </div>
          </div>
          <div className="rounded-lg bg-card/70 border border-border/50 px-3 py-2 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Difference
            </div>
            <div
              className={`text-xs sm:text-sm font-mono font-semibold mt-0.5 tabular-nums break-words ${
                difference === 0
                  ? 'text-muted-foreground'
                  : difference > 0
                  ? 'text-emerald-500'
                  : 'text-rose-500'
              }`}
            >
              {difference === 0 ? 'Exact Match' : formatSignedIDR(difference)}
            </div>
          </div>
        </div>

        {/* Scrollable Denominations */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Column Header */}
          <div className="grid grid-cols-[minmax(100px,1fr)_124px_minmax(95px,auto)] items-center gap-2 sm:gap-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Denomination</span>
            <span className="text-center">Count</span>
            <span className="text-right">Subtotal</span>
          </div>

          {/* Banknotes Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                <Banknote className="size-3.5 text-emerald-500" />
                Banknotes (Uang Kertas)
              </span>
              <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                {formatIDR(banknoteTotal)}
              </span>
            </div>
            {renderRows(BANKNOTE_ITEMS)}
          </div>

          {/* Coins Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                <Coins className="size-3.5 text-amber-500" />
                Coins (Uang Logam)
              </span>
              <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                {formatIDR(coinTotal)}
              </span>
            </div>
            {renderRows(COIN_ITEMS)}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-muted/30 border-t border-border/70 shrink-0 space-y-2.5">
          {difference !== 0 && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={recordAdjustment}
                onChange={(e) => setRecordAdjustment(e.target.checked)}
                className="size-3.5 rounded border-input accent-primary cursor-pointer"
              />
              <span>
                Record difference (<b className="text-foreground font-mono">{formatSignedIDR(difference)}</b>) as a Balance Adjustment in General Ledger
              </span>
            </label>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs h-8 px-2.5 text-muted-foreground hover:text-foreground gap-1.5 self-start sm:self-auto"
            >
              <RotateCcw className="size-3.5" />
              <span>Clear All (0)</span>
            </Button>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs h-8.5 px-3"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                className="text-xs h-8.5 px-3.5 bg-primary text-primary-foreground font-medium gap-1.5 shadow-2xs"
              >
                <CheckCircle2 className="size-3.5" />
                <span>Apply {formatIDR(calculatedTotal)}</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
