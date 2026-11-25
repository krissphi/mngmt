'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { Account } from '@/types';
import { formatIDR, formatSignedIDR } from '@/lib/currency';
import { calculateCashBreakdownTotal } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Building2,
  CreditCard,
  Banknote,
  Plus,
  Trash2,
  Search,
  Pencil,
  ArrowRightLeft,
  Calculator,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { AccountDialog, AccountSavePayload } from './account-dialog';
import { TransferDialog } from './transfer-dialog';
import { CashCalculatorDialog, RUPIAH_DENOMINATIONS } from './cash-calculator-dialog';
import { SummaryBanner } from '@/components/shared/summary-banner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { NoSearchResultState, EmptyState } from '@/components/states/state-views';

export function AccountsTab() {
  const { accounts, addAccount, updateAccount, deleteAccount } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAcc, setSelectedAcc] = useState<Account | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Transfer Dialog & Cash Calculator Dialog states
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferSourceId, setTransferSourceId] = useState<string | undefined>();
  const [cashCalcAccount, setCashCalcAccount] = useState<Account | null>(null);

  const filteredAccounts = useMemo(() => {
    if (!searchQuery.trim()) return accounts;
    const q = searchQuery.toLowerCase();
    return accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.accountNumber && a.accountNumber.includes(q)) ||
        (a.institution && a.institution.toLowerCase().includes(q))
    );
  }, [accounts, searchQuery]);

  const handleOpenAdd = () => {
    setSelectedAcc(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setSelectedAcc(acc);
    setDialogOpen(true);
  };

  const handleOpenTransfer = (sourceId?: string) => {
    setTransferSourceId(sourceId);
    setTransferOpen(true);
  };

  const handleSaveAccount = (data: AccountSavePayload) => {
    const { recordAdjustment, ...accountFields } = data;
    if (selectedAcc) {
      updateAccount(selectedAcc.id, accountFields, { recordAdjustment });
    } else {
      const initialBreakdown =
        accountFields.type === 'cash'
          ? { 100000: 0, 50000: 0, 20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0 }
          : undefined;
      addAccount({ ...accountFields, cashBreakdown: initialBreakdown, isActive: true });
    }
  };

  const accountToDelete = accounts.find((a) => a.id === deletingId);

  const { totalBalance, cashCount, bankCount, emoneyCount } = useMemo(() => {
    let total = 0;
    let cash = 0;
    let bank = 0;
    let emoney = 0;

    for (const a of accounts) {
      if (a.isActive) {
        total += a.balance || 0;
        if (a.type === 'cash') cash++;
        else if (a.type === 'bank') bank++;
        else emoney++;
      }
    }

    return {
      totalBalance: total,
      cashCount: cash,
      bankCount: bank,
      emoneyCount: emoney,
    };
  }, [accounts]);

  const getPocketTypeLabel = (type: string) => {
    if (type === 'cash') return 'Cash';
    if (type === 'bank') return 'Bank';
    return 'E-Money';
  };

  return (
    <div className="space-y-6">
      <SummaryBanner
        label="Total Liquid Balance"
        value={formatIDR(totalBalance)}
        meta={[`${cashCount} Cash`, `${bankCount} Bank`, `${emoneyCount} E-Money`]}
        actions={
          <>
            <Button
              onClick={() => handleOpenTransfer()}
              size="sm"
              variant="outline"
              className="text-xs gap-1.5 h-8.5 font-medium border-border/60 hover:bg-accent/60 rounded-lg"
            >
              <ArrowRightLeft className="size-3.5 text-muted-foreground" />
              <span>Transfer Funds</span>
            </Button>

            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="text-xs gap-1.5 h-8.5 bg-foreground text-background hover:bg-foreground/90 font-medium rounded-lg shadow-sm"
            >
              <Plus className="size-3.5" />
              <span>New Pocket</span>
            </Button>
          </>
        }
      />

      {/* Standalone Search Bar (No outer container box) */}
      <div className="relative max-w-sm">
        <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
        <Input
          placeholder="Search pockets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-8.5 text-xs bg-card/40 border-border/60 rounded-lg placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Grid of Clean Obsidian Pocket Cards */}
      {filteredAccounts.length === 0 ? (
        searchQuery ? (
          <NoSearchResultState query={searchQuery} onReset={() => setSearchQuery('')} />
        ) : (
          <EmptyState
            title="No Pockets Found"
            description="Add cash wallets, bank accounts, or digital e-wallets to track your liquid funds."
            action={<Button onClick={handleOpenAdd} size="sm">+ Add First Pocket</Button>}
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((acc) => {
            const isCash = acc.type === 'cash';
            const isBank = acc.type === 'bank';
            const Icon = isCash ? Banknote : isBank ? Building2 : CreditCard;

            // Extract active bills for cash pocket in a clean single-line summary
            const activeBills = isCash && acc.cashBreakdown
              ? RUPIAH_DENOMINATIONS
                  .filter((d) => (acc.cashBreakdown?.[d.value] || 0) > 0)
                  .map((d) => `${acc.cashBreakdown?.[d.value]}x ${d.label.replace('Rp ', '')}`)
              : [];
            const physicalTotal = isCash ? calculateCashBreakdownTotal(acc.cashBreakdown) : 0;
            const cashDiff = isCash ? physicalTotal - acc.balance : 0;

            return (
              <div
                key={acc.id}
                className="group relative rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs p-5 hover:border-border/90 hover:bg-card/90 transition-all duration-200 flex flex-col justify-between space-y-4"
              >
                {/* Header: Icon, Name, Type Pill & Action Menu */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`size-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isCash
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : isBank
                          ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                          : 'bg-violet-500/10 border-violet-500/20 text-violet-400'
                      }`}
                    >
                      <Icon className="size-4.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-foreground truncate">{acc.name}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <span className="capitalize">{getPocketTypeLabel(acc.type)}</span>
                        {acc.accountNumber && (
                          <>
                            <span>•</span>
                            <span className="font-mono">{acc.accountNumber}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(acc)}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/60 transition-colors"
                      title="Edit pocket"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    {accounts.length > 1 && (
                      <button
                        onClick={() => setDeletingId(acc.id)}
                        className="p-1.5 text-muted-foreground hover:text-rose-400 rounded-md hover:bg-accent/60 transition-colors"
                        title="Delete pocket"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Balance Display */}
                <div>
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Balance</span>
                  <div className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-mono tabular-nums mt-0.5 break-words">
                    {formatIDR(acc.balance)}
                  </div>

                  {/* Cash Pocket: Clean, un-nested breakdown summary + sync indicator */}
                  {isCash && (
                    <div className="mt-2 space-y-1">
                      <div className="text-[11px] text-muted-foreground line-clamp-1 font-mono">
                        {activeBills.length > 0 ? (
                          <span className="text-muted-foreground">
                            Bills: <b className="text-foreground/90 font-normal">{activeBills.slice(0, 3).join(' • ')}</b>
                            {activeBills.length > 3 && ` +${activeBills.length - 3} more`}
                          </span>
                        ) : (
                          <span className="italic text-muted-foreground/60">No physical breakdown recorded</span>
                        )}
                      </div>
                      {cashDiff === 0 && (acc.balance > 0 || activeBills.length > 0) ? (
                        <div className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                          <CheckCircle2 className="size-3 shrink-0" />
                          <span>Physical bills match balance</span>
                        </div>
                      ) : cashDiff !== 0 ? (
                        <button
                          type="button"
                          onClick={() => setCashCalcAccount(acc)}
                          className="inline-flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 font-medium transition-colors"
                          title="Click to recount physical bills and sync"
                        >
                          <AlertCircle className="size-3 shrink-0" />
                          <span>Bills diff {formatSignedIDR(cashDiff)} • Sync</span>
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Footer Actions (Subtle & clean) */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                  <button
                    onClick={() => handleOpenTransfer(acc.id)}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium py-1 transition-colors"
                  >
                    <ArrowRightLeft className="size-3.5" />
                    <span>Transfer</span>
                  </button>

                  {isCash && (
                    <button
                      onClick={() => setCashCalcAccount(acc)}
                      className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium py-1 transition-colors"
                    >
                      <Calculator className="size-3.5" />
                      <span>Count Bills</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Account / Pocket Dialog */}
      <AccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialAccount={selectedAcc}
        onSave={handleSaveAccount}
      />

      {/* Transfer Between Pockets Dialog */}
      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        defaultSourceId={transferSourceId}
      />

      {/* Cash Denominations Calculator Dialog */}
      <CashCalculatorDialog
        open={!!cashCalcAccount}
        onOpenChange={(open) => !open && setCashCalcAccount(null)}
        account={cashCalcAccount}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete Pocket?"
        description={`Are you sure you want to delete "${accountToDelete?.name}"? Associated transaction history will remain preserved in your records.`}
        confirmText="Delete Pocket"
        cancelText="Cancel"
        onConfirm={() => {
          if (deletingId) {
            deleteAccount(deletingId);
            setDeletingId(null);
          }
        }}
      />
    </div>
  );
}
