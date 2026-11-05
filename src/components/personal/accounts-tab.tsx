'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { Account } from '@/types';
import { formatIDR } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, CreditCard, Banknote, Wallet, Plus, Trash2, Search, Pencil } from 'lucide-react';
import { AccountDialog } from './account-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { NoSearchResultState, EmptyState } from '@/components/states/state-views';

export function AccountsTab() {
  const { accounts, addAccount, updateAccount, deleteAccount } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAcc, setSelectedAcc] = useState<Account | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleSaveAccount = (data: { name: string; type: Account['type']; balance: number; accountNumber?: string }) => {
    if (selectedAcc) {
      updateAccount(selectedAcc.id, data);
    } else {
      addAccount({ ...data, isActive: true });
    }
  };

  const accountToDelete = accounts.find((a) => a.id === deletingId);

  return (
    <div className="space-y-4">
      {/* Standard Tab Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search accounts or account numbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8.5 h-8.5 text-xs"
          />
        </div>

        <Button
          onClick={handleOpenAdd}
          size="sm"
          className="text-xs gap-1.5 h-8 self-start sm:self-auto bg-primary text-primary-foreground font-medium"
        >
          <Plus className="size-3.5" />
          <span>Add Account</span>
        </Button>
      </div>

      {/* Grid of Accounts */}
      {filteredAccounts.length === 0 ? (
        searchQuery ? (
          <NoSearchResultState query={searchQuery} onReset={() => setSearchQuery('')} />
        ) : (
          <EmptyState
            title="No Financial Accounts Found"
            description="Add a bank account or cash wallet to start tracking your finances."
            action={<Button onClick={handleOpenAdd} size="sm">+ Add Account</Button>}
          />
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredAccounts.map((acc) => {
            const Icon =
              acc.type === 'bank' ? Building2 : acc.type === 'e_wallet' ? CreditCard : acc.type === 'cash' ? Banknote : Wallet;

            return (
              <Card key={acc.id} className="border-border/60 bg-card hover:border-border transition-colors shadow-2xs">
                <CardContent className="p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-md bg-muted text-foreground flex items-center justify-center">
                        <Icon className="size-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-foreground line-clamp-1">{acc.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {acc.type.replace('_', ' ')} {acc.accountNumber && `• ${acc.accountNumber}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(acc)}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors"
                        title="Edit account details & balance"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      {accounts.length > 1 && (
                        <button
                          onClick={() => setDeletingId(acc.id)}
                          className="p-1.5 text-muted-foreground/70 hover:text-rose-600 rounded transition-colors"
                          title="Delete account"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Current Balance</span>
                    <span className="text-sm font-bold text-foreground tabular-nums whitespace-nowrap">
                      {formatIDR(acc.balance)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Account Dialog */}
      <AccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialAccount={selectedAcc}
        onSave={handleSaveAccount}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete Account?"
        description={`Are you sure you want to delete "${accountToDelete?.name}"? Historical transactions linked to this account will remain in your ledger.`}
        confirmText="Delete Account"
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
