'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { DebtDirection, DebtRecord } from '@/types';
import { formatIDR, formatSignedIDR } from '@/lib/currency';
import { getLocalDateString } from '@/lib/date';
import { SummaryBanner } from '@/components/shared/summary-banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/states/state-views';
import { Plus, CheckCircle2, Trash2, ArrowDownLeft, ArrowUpRight, Calendar, Wallet } from 'lucide-react';

export function DebtsTab() {
  const { debts, accounts, addDebt, recordDebtPayment, deleteDebt } = useStore();
  const [filterDir, setFilterDir] = useState<'all' | DebtDirection>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [payingDebt, setPayingDebt] = useState<DebtRecord | null>(null);
  const [deletingDebt, setDeletingDebt] = useState<DebtRecord | null>(null);

  // Add form state
  const [direction, setDirection] = useState<DebtDirection>('payable');
  const [title, setTitle] = useState('');
  const [counterparty, setCounterparty] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Payment form state
  const [payAmount, setPayAmount] = useState('');
  const [payAccountId, setPayAccountId] = useState('');
  const [payDate, setPayDate] = useState(() => getLocalDateString());

  const { totalPayableOpen, totalReceivableOpen, openCount, settledCount } = useMemo(() => {
    let pay = 0;
    let rec = 0;
    let open = 0;
    let settled = 0;
    for (const d of debts) {
      if (d.status === 'settled') {
        settled++;
        continue;
      }
      open++;
      const rem = Math.max(0, d.totalAmount - d.paidAmount);
      if (d.direction === 'payable') pay += rem;
      else rec += rem;
    }
    return {
      totalPayableOpen: pay,
      totalReceivableOpen: rec,
      openCount: open,
      settledCount: settled,
    };
  }, [debts]);

  const visibleDebts = useMemo(() => {
    return debts.filter((d) => filterDir === 'all' || d.direction === filterDir);
  }, [debts, filterDir]);

  const handleOpenAdd = () => {
    setDirection('payable');
    setTitle('');
    setCounterparty('');
    setTotalAmount('');
    setDueDate('');
    setNotes('');
    setAddOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(totalAmount) || 0;
    if (!title.trim() || amt <= 0) return;

    addDebt({
      direction,
      title: title.trim(),
      counterparty: counterparty.trim() || 'Other Party',
      totalAmount: amt,
      paidAmount: 0,
      dueDate: dueDate || undefined,
      status: 'open',
      notes: notes.trim() || undefined,
    });
    setAddOpen(false);
  };

  const openPayDialog = (debt: DebtRecord) => {
    const remaining = Math.max(0, debt.totalAmount - debt.paidAmount);
    setPayingDebt(debt);
    setPayAmount(String(remaining));
    setPayAccountId(debt.accountId || accounts[0]?.id || '');
    setPayDate(getLocalDateString());
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebt) return;
    const amt = Number(payAmount) || 0;
    if (amt <= 0) return;
    recordDebtPayment(payingDebt.id, amt, payAccountId || undefined, payDate);
    setPayingDebt(null);
  };

  const netPosition = totalReceivableOpen - totalPayableOpen;

  return (
    <div className="space-y-6">
      <SummaryBanner
        label="Net Receivables vs Payables"
        value={formatSignedIDR(netPosition)}
        valueClassName={netPosition >= 0 ? 'text-emerald-500' : 'text-rose-500'}
        meta={[
          `${debts.length} Records (${openCount} Open • ${settledCount} Settled)`,
          `Receivable +${formatIDR(totalReceivableOpen)}`,
          `Payable -${formatIDR(totalPayableOpen)}`,
        ]}
        actions={
          <>
            <div className="inline-flex p-0.5 bg-secondary/40 backdrop-blur-xs rounded-xl border border-border/40 gap-0.5">
              {(['all', 'payable', 'receivable'] as const).map((dir) => (
                <button
                  key={dir}
                  onClick={() => setFilterDir(dir)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    filterDir === dir
                      ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {dir === 'all' ? 'All' : dir === 'payable' ? 'Payables' : 'Receivables'}
                </button>
              ))}
            </div>
            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="text-xs h-8.5 gap-1.5 bg-foreground text-background hover:bg-foreground/90 font-medium rounded-lg shadow-sm"
            >
              <Plus className="size-3.5" />
              <span>Add Record</span>
            </Button>
          </>
        }
      />

      {visibleDebts.length === 0 ? (
        <EmptyState
          icon={<Wallet className="size-8" />}
          title="No Payables or Receivables"
          description="Track supplier invoices, loans, or customer receivables so your Balance Sheet reflects true liabilities and assets."
          action={
            <Button onClick={handleOpenAdd} size="sm">
              + Add Debt / Receivable
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleDebts.map((debt) => {
            const remaining = Math.max(0, debt.totalAmount - debt.paidAmount);
            const pct = debt.totalAmount > 0 ? Math.min(100, Math.round((debt.paidAmount / debt.totalAmount) * 100)) : 0;
            const isPayable = debt.direction === 'payable';
            const isSettled = debt.status === 'settled';

            return (
              <div
                key={debt.id}
                className={`group rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs p-5 hover:border-border/90 hover:bg-card/90 transition-all duration-200 flex flex-col justify-between space-y-4 ${
                  isSettled ? 'opacity-65' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`size-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isPayable
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                      }`}
                    >
                      {isPayable ? <ArrowUpRight className="size-4.5" /> : <ArrowDownLeft className="size-4.5" />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-foreground leading-snug break-words">
                        {debt.title}
                      </h4>
                      <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{debt.counterparty}</span>
                        <span>•</span>
                        <span className={isSettled ? 'text-emerald-500 font-medium' : isPayable ? 'text-rose-500 font-medium' : 'text-emerald-500 font-medium'}>
                          {isSettled ? 'Settled' : isPayable ? 'Payable' : 'Receivable'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setDeletingDebt(debt)}
                    className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-md hover:bg-accent/60 shrink-0 opacity-75 group-hover:opacity-100 transition-opacity"
                    title="Delete record"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <div>
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium block">
                        Remaining
                      </span>
                      <div
                        className={`text-lg sm:text-xl font-bold tracking-tight font-mono tabular-nums mt-0.5 ${
                          isPayable ? 'text-rose-500' : 'text-emerald-500'
                        }`}
                      >
                        {formatIDR(remaining)}
                      </div>
                    </div>

                    <Badge variant="outline" className="text-[11px] font-mono px-2 py-0.5 border-border/50">
                      {pct}% paid
                    </Badge>
                  </div>

                  <div className="w-full h-2 rounded-full bg-secondary/70 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isPayable ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums text-muted-foreground">
                    <span>Total {formatIDR(debt.totalAmount)}</span>
                    {debt.dueDate && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3" />
                        {debt.dueDate}
                      </span>
                    )}
                  </div>
                </div>

                {!isSettled && (
                  <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs">
                    <span className="text-muted-foreground">
                      Paid {formatIDR(debt.paidAmount)}
                    </span>
                    <button
                      onClick={() => openPayDialog(debt)}
                      className="flex items-center gap-1.5 text-emerald-500 hover:text-emerald-400 font-medium py-0.5 transition-colors"
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>{isPayable ? 'Record Payment' : 'Record Collection'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Debt Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Add Payable / Receivable</DialogTitle>
            <DialogDescription className="text-xs">
              Log supplier invoices, loans, or receivables to track on your Balance Sheet.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection('payable')}
                className={`p-2 rounded-lg border text-xs font-medium ${
                  direction === 'payable'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                    : 'border-border bg-card text-muted-foreground'
                }`}
              >
                Payable (Hutang)
              </button>
              <button
                type="button"
                onClick={() => setDirection('receivable')}
                className={`p-2 rounded-lg border text-xs font-medium ${
                  direction === 'receivable'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                    : 'border-border bg-card text-muted-foreground'
                }`}
              >
                Receivable (Piutang)
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Title / Reference</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Supplier Invoice #102" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Counterparty</label>
                <Input value={counterparty} onChange={(e) => setCounterparty(e.target.value)} placeholder="Vendor / Person name" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Total Amount (Rp)</label>
                <Input type="number" min={1} value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Due Date (Optional)</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Notes (Optional)</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Payment terms..." />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary text-primary-foreground">
                Save Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={!!payingDebt} onOpenChange={(open) => !open && setPayingDebt(null)}>
        <DialogContent className="max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {payingDebt?.direction === 'payable' ? 'Record Debt Payment' : 'Record Receivable Collection'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {payingDebt?.title} ({payingDebt?.counterparty})
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePaySubmit} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Amount (Rp)</label>
                <Input type="number" min={1} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Date</label>
                <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Pocket (Updates Balance &amp; Ledger)</label>
              <select
                className="w-full h-8.5 rounded-md border border-input bg-card px-2.5 text-xs text-foreground"
                value={payAccountId}
                onChange={(e) => setPayAccountId(e.target.value)}
              >
                <option value="">Mark settled without pocket transaction</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatIDR(a.balance)})
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPayingDebt(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary text-primary-foreground">
                Confirm Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingDebt}
        onOpenChange={(open) => !open && setDeletingDebt(null)}
        title="Delete Record?"
        description={`Remove "${deletingDebt?.title}" from Payables & Receivables?`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          if (deletingDebt) {
            deleteDebt(deletingDebt.id);
            setDeletingDebt(null);
          }
        }}
      />
    </div>
  );
}
