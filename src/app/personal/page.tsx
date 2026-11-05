'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { PersonalSummaryTab } from '@/components/personal/personal-summary-tab';
import { AccountsTab } from '@/components/personal/accounts-tab';
import { TransactionsTab } from '@/components/personal/transactions-tab';
import { BudgetsTab } from '@/components/personal/budgets-tab';
import { WishlistTab } from '@/components/personal/wishlist-tab';
import { SubscriptionsTab } from '@/components/personal/subscriptions-tab';

type ActiveTab = 'summary' | 'accounts' | 'transactions' | 'budgets' | 'wishlist' | 'subscriptions';

export default function PersonalFinancePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personal Finance"
        description="Manage bank accounts, transactions, budget allocations, wishlist items, and subscriptions."
      />

      {/* Clean Tab Pill Bar */}
      <div className="flex flex-wrap gap-1 border-b border-border/80 pb-2">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'summary'
              ? 'bg-muted text-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'accounts'
              ? 'bg-muted text-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Accounts & Wallets
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'transactions'
              ? 'bg-muted text-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => setActiveTab('budgets')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'budgets'
              ? 'bg-muted text-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Budgets
        </button>
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'wishlist'
              ? 'bg-muted text-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Wishlist
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'subscriptions'
              ? 'bg-muted text-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Subscriptions
        </button>
      </div>

      {activeTab === 'summary' && <PersonalSummaryTab />}
      {activeTab === 'accounts' && <AccountsTab />}
      {activeTab === 'transactions' && <TransactionsTab />}
      {activeTab === 'budgets' && <BudgetsTab />}
      {activeTab === 'wishlist' && <WishlistTab />}
      {activeTab === 'subscriptions' && <SubscriptionsTab />}
    </div>
  );
}
