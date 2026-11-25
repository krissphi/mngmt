'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { PersonalSummaryTab } from '@/components/personal/personal-summary-tab';
import { AccountsTab } from '@/components/personal/accounts-tab';
import { TransactionsTab } from '@/components/personal/transactions-tab';
import { BudgetsTab } from '@/components/personal/budgets-tab';
import { SubscriptionsTab } from '@/components/personal/subscriptions-tab';
import { SavingsGoalsTab } from '@/components/personal/savings-goals-tab';
import { WishlistTab } from '@/components/personal/wishlist-tab';
import { LayoutDashboard, Wallet, Receipt, PieChart, CreditCard, Target, Heart } from 'lucide-react';

type FinanceTab = 'overview' | 'pockets' | 'transactions' | 'budgets' | 'subscriptions' | 'goals' | 'wishlist';

const VALID_TABS: FinanceTab[] = ['overview', 'pockets', 'transactions', 'budgets', 'subscriptions', 'goals', 'wishlist'];

function FinanceContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as FinanceTab | null;
  const validTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : null;

  const [prevTabParam, setPrevTabParam] = useState(tabParam);
  const [activeTab, setActiveTab] = useState<FinanceTab>(validTab || 'overview');

  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam);
    if (validTab) {
      setActiveTab(validTab);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personal Finance"
        description="Manage your pockets, track income and expenses, set budgets, savings goals, and subscriptions."
      />

      {/* Sleek Obsidian Segmented Control */}
      <div className="inline-flex p-1 bg-secondary/40 backdrop-blur-xs rounded-xl border border-border/40 gap-1 flex-wrap">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
            activeTab === 'overview'
              ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
          }`}
        >
          <LayoutDashboard className="size-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('pockets')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
            activeTab === 'pockets'
              ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
          }`}
        >
          <Wallet className="size-3.5" />
          <span>Pockets</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
            activeTab === 'transactions'
              ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
          }`}
        >
          <Receipt className="size-3.5" />
          <span>Transactions</span>
        </button>

        <button
          onClick={() => setActiveTab('budgets')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
            activeTab === 'budgets'
              ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
          }`}
        >
          <PieChart className="size-3.5" />
          <span>Budgets</span>
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
            activeTab === 'subscriptions'
              ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
          }`}
        >
          <CreditCard className="size-3.5" />
          <span>Subscriptions</span>
        </button>

        <button
          onClick={() => setActiveTab('goals')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
            activeTab === 'goals'
              ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
          }`}
        >
          <Target className="size-3.5" />
          <span>Goals</span>
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
            activeTab === 'wishlist'
              ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
          }`}
        >
          <Heart className="size-3.5" />
          <span>Wishlist</span>
        </button>
      </div>

      {activeTab === 'overview' && <PersonalSummaryTab />}
      {activeTab === 'pockets' && <AccountsTab />}
      {activeTab === 'transactions' && <TransactionsTab />}
      {activeTab === 'budgets' && <BudgetsTab />}
      {activeTab === 'subscriptions' && <SubscriptionsTab />}
      {activeTab === 'goals' && <SavingsGoalsTab />}
      {activeTab === 'wishlist' && <WishlistTab />}
    </div>
  );
}

export default function FinancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-muted-foreground">Loading Finance...</div>}>
      <FinanceContent />
    </Suspense>
  );
}
