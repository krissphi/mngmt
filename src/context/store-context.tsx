'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Account, Category, Product, Supplier, Sale, Transaction,
  Budget, SavingsGoal, WishlistItem, Asset, InventoryMovement, Subscription
} from '@/types';
import {
  INITIAL_ACCOUNTS, INITIAL_CATEGORIES, INITIAL_SUPPLIERS, INITIAL_PRODUCTS,
  INITIAL_INVENTORY_MOVEMENTS, INITIAL_SALES, INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS, INITIAL_SAVINGS_GOALS, INITIAL_WISHLIST, INITIAL_ASSETS, INITIAL_SUBSCRIPTIONS
} from '@/lib/seed-data';
import { loadStorageState, saveStorageState, clearStorageState } from './local-storage-adapter';
import {
  applySaleToProducts, createInventoryMovement,
  cleanCategoryName, advanceNextBillingDate, deduplicateById,
  applyDeleteTransaction, applySaleStatusUpdateSingle
} from './store-handlers';
import { StoreContextType } from './store-types';

const StoreContext = createContext<StoreContextType | null>(null);

function generateSecureId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(INITIAL_INVENTORY_MOVEMENTS);
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [budgets, setBudgets] = useState<Budget[]>(INITIAL_BUDGETS);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(INITIAL_SAVINGS_GOALS);
  const [wishlist, setWishlist] = useState<WishlistItem[]>(INITIAL_WISHLIST);
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(INITIAL_SUBSCRIPTIONS);

  // IndexedDB + LocalStorage migration load
  useEffect(() => {
    loadStorageState().then((s) => {
      if (s) {
        if (s.accounts) setAccounts(deduplicateById(s.accounts));
        if (s.categories) setCategories(deduplicateById(s.categories).map((c) => ({ ...c, name: cleanCategoryName(c.name) })));
        if (s.suppliers) setSuppliers(deduplicateById(s.suppliers));
        if (s.products) setProducts(deduplicateById(s.products));
        if (s.inventoryMovements) setInventoryMovements(deduplicateById(s.inventoryMovements));
        if (s.sales) setSales(deduplicateById(s.sales));
        if (s.transactions) setTransactions(deduplicateById(s.transactions));
        if (s.budgets) setBudgets(deduplicateById(s.budgets));
        if (s.savingsGoals) setSavingsGoals(deduplicateById(s.savingsGoals));
        if (s.wishlist) setWishlist(deduplicateById(s.wishlist));
        if (s.assets) setAssets(deduplicateById(s.assets).map((a) => ({ ...a, category: cleanCategoryName(a.category) })));
        if (s.subscriptions) setSubscriptions(deduplicateById(s.subscriptions));
      }
      setIsLoaded(true);
    });
  }, []);

  // IndexedDB + LocalStorage save (debounced 250ms for smooth UI performance)
  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => {
      saveStorageState({
        accounts, categories, suppliers, products, inventoryMovements,
        sales, transactions, budgets, savingsGoals, wishlist, assets, subscriptions
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [isLoaded, accounts, categories, suppliers, products, inventoryMovements, sales, transactions, budgets, savingsGoals, wishlist, assets, subscriptions]);

  const addTransaction = useCallback((trx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTrx: Transaction = { ...trx, id: generateSecureId('trx'), createdAt: new Date().toISOString() };
    setTransactions((prev) => [newTrx, ...prev]);
    setAccounts((prev) => prev.map((acc) => {
      if (acc.id === trx.accountId) {
        return { ...acc, balance: acc.balance + (trx.type === 'income' ? trx.amount : -trx.amount), updatedAt: new Date().toISOString() };
      }
      if (trx.type === 'transfer' && acc.id === trx.toAccountId) {
        return { ...acc, balance: acc.balance + trx.amount, updatedAt: new Date().toISOString() };
      }
      return acc;
    }));
    return newTrx;
  }, []);

  const addTransactionsBatch = useCallback((trxs: Omit<Transaction, 'id' | 'createdAt'>[]) => {
    if (trxs.length === 0) return;
    const now = new Date().toISOString();
    const newTrxs: Transaction[] = trxs.map((t) => ({
      ...t,
      id: generateSecureId('trx'),
      createdAt: now,
    }));

    const balanceDeltas = new Map<string, number>();
    for (const trx of trxs) {
      const delta = trx.type === 'income' ? trx.amount : -trx.amount;
      balanceDeltas.set(trx.accountId, (balanceDeltas.get(trx.accountId) || 0) + delta);
      if (trx.type === 'transfer' && trx.toAccountId) {
        balanceDeltas.set(trx.toAccountId, (balanceDeltas.get(trx.toAccountId) || 0) + trx.amount);
      }
    }

    setTransactions((prev) => [...newTrxs, ...prev]);
    setAccounts((prev) =>
      prev.map((acc) => {
        const delta = balanceDeltas.get(acc.id);
        if (delta !== undefined && delta !== 0) {
          return { ...acc, balance: acc.balance + delta, updatedAt: now };
        }
        return acc;
      })
    );
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prevTrx) => {
      setAccounts((prevAccs) => {
        const { updatedAccounts } = applyDeleteTransaction(prevTrx, prevAccs, id);
        return updatedAccounts;
      });
      return prevTrx.filter((t) => t.id !== id);
    });
  }, []);

  const addProduct = useCallback((p: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stockSold' | 'stockReserved'>) => {
    const id = generateSecureId('prod');
    const now = new Date().toISOString().split('T')[0];
    const newP: Product = { ...p, id, stockSold: 0, stockReserved: 0, createdAt: now, updatedAt: now };
    setProducts((prev) => [newP, ...prev]);
    if (p.stockOnHand > 0) {
      setInventoryMovements((prev) => [createInventoryMovement(id, 'adjustment_in', p.stockOnHand, 'Initial stock'), ...prev]);
    }
    return newP;
  }, []);

  const addProductsBatch = useCallback(
    (prods: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stockSold' | 'stockReserved'>[]) => {
      if (prods.length === 0) return;
      const now = new Date().toISOString().split('T')[0];
      const newProducts: Product[] = [];
      const newMovements: InventoryMovement[] = [];

      for (const p of prods) {
        const id = generateSecureId('prod');
        newProducts.push({ ...p, id, stockSold: 0, stockReserved: 0, createdAt: now, updatedAt: now });
        if (p.stockOnHand > 0) {
          newMovements.push(createInventoryMovement(id, 'adjustment_in', p.stockOnHand, 'Initial stock import'));
        }
      }

      setProducts((prev) => [...newProducts, ...prev]);
      if (newMovements.length > 0) {
        setInventoryMovements((prev) => [...newMovements, ...prev]);
      }
    },
    []
  );

  const updateProduct = useCallback((id: string, u: Partial<Product>) => setProducts((p) => p.map((i) => i.id === id ? { ...i, ...u, updatedAt: new Date().toISOString() } : i)), []);
  const deleteProduct = useCallback((id: string) => setProducts((p) => p.filter((i) => i.id !== id)), []);

  const adjustStock = useCallback((productId: string, quantityChange: number, type: InventoryMovement['type'], notes: string) => {
    const now = new Date().toISOString();
    setProducts((prevProds) => {
      const target = prevProds.find((p) => p.id === productId);
      if (!target) return prevProds;
      const prevStock = target.stockOnHand;
      const newStock = Math.max(0, prevStock + quantityChange);
      const mov: InventoryMovement = {
        id: generateSecureId('mov'),
        productId,
        type,
        quantity: quantityChange,
        previousStock: prevStock,
        newStock,
        notes,
        createdAt: now.replace('T', ' ').substring(0, 19),
      };
      // Queue movement safely
      setTimeout(() => {
        setInventoryMovements((m) => [mov, ...m]);
      }, 0);
      return prevProds.map((prod) => prod.id === productId ? { ...prod, stockOnHand: newStock, updatedAt: now } : prod);
    });
  }, []);

  const recordSale = useCallback((s: Omit<Sale, 'id' | 'createdAt' | 'orderNumber'> & { orderNumber?: string }) => {
    const saleId = generateSecureId('sale');
    const orderNumber = s.orderNumber || `ORD-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const newSale: Sale = { ...s, id: saleId, orderNumber, createdAt: now };

    setSales((prev) => [newSale, ...prev]);
    setProducts((prev) => {
      const { updatedProducts, movements } = applySaleToProducts(prev, newSale, now);
      if (movements.length > 0) {
        setTimeout(() => {
          setInventoryMovements((m) => [...movements, ...m]);
        }, 0);
      }
      return updatedProducts;
    });

    if (newSale.paymentAccountId && newSale.paymentStatus === 'paid') {
      const netReceived = newSale.grossSales - newSale.marketplaceFees - newSale.discounts;
      addTransaction({
        date: newSale.saleDate, scope: 'business', type: 'income', amount: netReceived,
        accountId: newSale.paymentAccountId, sourceModule: 'business_sale', referenceId: saleId,
        description: `Sale ${newSale.channel.toUpperCase()} #${orderNumber}`,
      });
    }
    return newSale;
  }, [addTransaction]);

  const updateSaleStatus = useCallback((saleId: string, newStatus: Sale['orderStatus']) => {
    const now = new Date().toISOString();
    setSales((prevSales) => {
      setProducts((prevProducts) => {
        const result = applySaleStatusUpdateSingle(prevSales, prevProducts, saleId, newStatus, now);
        if (result.movements.length > 0) {
          setTimeout(() => {
            setInventoryMovements((prevMov) => [...result.movements, ...prevMov]);
          }, 0);
        }
        return result.updatedProducts;
      });
      return prevSales.map((s) => (s.id === saleId ? { ...s, orderStatus: newStatus } : s));
    });
  }, []);

  const addAccount = useCallback((a: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newA: Account = { ...a, id: generateSecureId('acc'), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setAccounts((prev) => [...prev, newA]);
    return newA;
  }, []);
  const updateAccount = useCallback((id: string, u: Partial<Account>) => setAccounts((p) => p.map((a) => a.id === id ? { ...a, ...u } : a)), []);
  const deleteAccount = useCallback((id: string) => setAccounts((p) => p.filter((a) => a.id !== id)), []);

  const addBudget = useCallback((b: Omit<Budget, 'id'>) => {
    const newB: Budget = { ...b, id: generateSecureId('bgt') };
    setBudgets((prev) => [...prev, newB]);
    return newB;
  }, []);
  const updateBudget = useCallback((id: string, u: Partial<Budget>) => setBudgets((p) => p.map((b) => b.id === id ? { ...b, ...u } : b)), []);
  const deleteBudget = useCallback((id: string) => setBudgets((p) => p.filter((b) => b.id !== id)), []);

  const addSavingsGoal = useCallback((g: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    const newG: SavingsGoal = { ...g, id: generateSecureId('svg'), createdAt: new Date().toISOString() };
    setSavingsGoals((prev) => [...prev, newG]);
    return newG;
  }, []);
  const updateSavingsGoal = useCallback((id: string, u: Partial<SavingsGoal>) => setSavingsGoals((p) => p.map((g) => g.id === id ? { ...g, ...u } : g)), []);
  const deleteSavingsGoal = useCallback((id: string) => setSavingsGoals((p) => p.filter((g) => g.id !== id)), []);

  const addWishlistItem = useCallback((w: Omit<WishlistItem, 'id' | 'createdAt'>) => {
    const newW: WishlistItem = { ...w, id: generateSecureId('wsh'), createdAt: new Date().toISOString() };
    setWishlist((prev) => [newW, ...prev]);
    return newW;
  }, []);
  const updateWishlistItem = useCallback((id: string, u: Partial<WishlistItem>) => setWishlist((p) => p.map((w) => w.id === id ? { ...w, ...u } : w)), []);
  const deleteWishlistItem = useCallback((id: string) => setWishlist((p) => p.filter((w) => w.id !== id)), []);

  const addAsset = useCallback((a: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>, paymentAccountId?: string) => {
    const now = new Date().toISOString();
    const newA: Asset = { ...a, id: generateSecureId('ast'), createdAt: now, updatedAt: now };
    setAssets((prev) => [newA, ...prev]);
    if (paymentAccountId && a.purchasePrice > 0) {
      addTransaction({
        date: a.purchaseDate || now.split('T')[0], scope: 'personal', type: 'expense', amount: a.purchasePrice,
        accountId: paymentAccountId, sourceModule: 'personal_expense', description: `Collectible Asset: ${a.name}`, referenceId: newA.id,
      });
    }
    return newA;
  }, [addTransaction]);
  const updateAsset = useCallback((id: string, u: Partial<Asset>) => setAssets((p) => p.map((a) => a.id === id ? { ...a, ...u } : a)), []);
  const deleteAsset = useCallback((id: string) => setAssets((p) => p.filter((a) => a.id !== id)), []);

  const addSupplier = useCallback((s: Omit<Supplier, 'id' | 'createdAt'>) => {
    const newS: Supplier = { ...s, id: generateSecureId('sup'), createdAt: new Date().toISOString() };
    setSuppliers((prev) => [...prev, newS]);
    return newS;
  }, []);
  const deleteSupplier = useCallback((id: string) => setSuppliers((p) => p.filter((s) => s.id !== id)), []);

  const addSubscription = useCallback((s: Omit<Subscription, 'id' | 'createdAt'>) => {
    const newS: Subscription = { ...s, id: generateSecureId('sub'), createdAt: new Date().toISOString() };
    setSubscriptions((prev) => [...prev, newS]);
    return newS;
  }, []);
  const updateSubscription = useCallback((id: string, u: Partial<Subscription>) => setSubscriptions((p) => p.map((s) => s.id === id ? { ...s, ...u } : s)), []);
  const deleteSubscription = useCallback((id: string) => setSubscriptions((p) => p.filter((s) => s.id !== id)), []);
  const paySubscription = useCallback((id: string, paymentDetails?: { accountId?: string; date?: string; amount?: number }) => {
    const sub = subscriptions.find((s) => s.id === id);
    if (!sub) return;
    const nowIso = paymentDetails?.date || new Date().toISOString().split('T')[0];
    const amount = paymentDetails?.amount ?? sub.amount;
    const accountId = paymentDetails?.accountId || sub.accountId;
    addTransaction({
      date: nowIso,
      scope: 'personal',
      type: 'expense',
      amount,
      accountId,
      categoryId: sub.categoryId,
      sourceModule: 'personal_expense',
      description: `Subscription: ${sub.name}`,
      isRecurring: true,
    });
    setSubscriptions((p) => p.map((s) => s.id !== id ? s : { ...s, nextBillingDate: advanceNextBillingDate(s.nextBillingDate || nowIso, s.billingCycle) }));
  }, [subscriptions, addTransaction]);

  const resetToDemoData = useCallback(() => {
    clearStorageState();
    setAccounts(INITIAL_ACCOUNTS); setCategories(INITIAL_CATEGORIES); setSuppliers(INITIAL_SUPPLIERS); setProducts(INITIAL_PRODUCTS);
    setInventoryMovements(INITIAL_INVENTORY_MOVEMENTS); setSales(INITIAL_SALES);
    setTransactions(INITIAL_TRANSACTIONS); setBudgets(INITIAL_BUDGETS); setSavingsGoals(INITIAL_SAVINGS_GOALS);
    setWishlist(INITIAL_WISHLIST); setAssets(INITIAL_ASSETS); setSubscriptions(INITIAL_SUBSCRIPTIONS);
  }, []);

  const restoreFullBackup = useCallback((raw: unknown): boolean => {
    if (!raw || typeof raw !== 'object') return false;
    try {
      const data = raw as Record<string, unknown>;
      if (Array.isArray(data.accounts)) setAccounts(deduplicateById(data.accounts as Account[]));
      if (Array.isArray(data.categories)) setCategories(deduplicateById(data.categories as Category[]));
      if (Array.isArray(data.suppliers)) setSuppliers(deduplicateById(data.suppliers as Supplier[]));
      if (Array.isArray(data.products)) setProducts(deduplicateById(data.products as Product[]));
      if (Array.isArray(data.inventoryMovements)) setInventoryMovements(deduplicateById(data.inventoryMovements as InventoryMovement[]));
      if (Array.isArray(data.sales)) setSales(deduplicateById(data.sales as Sale[]));
      if (Array.isArray(data.transactions)) setTransactions(deduplicateById(data.transactions as Transaction[]));
      if (Array.isArray(data.budgets)) setBudgets(deduplicateById(data.budgets as Budget[]));
      if (Array.isArray(data.savingsGoals)) setSavingsGoals(deduplicateById(data.savingsGoals as SavingsGoal[]));
      if (Array.isArray(data.wishlist)) setWishlist(deduplicateById(data.wishlist as WishlistItem[]));
      if (Array.isArray(data.assets)) setAssets(deduplicateById(data.assets as Asset[]));
      if (Array.isArray(data.subscriptions)) setSubscriptions(deduplicateById(data.subscriptions as Subscription[]));
      return true;
    } catch {
      return false;
    }
  }, []);

  const value = useMemo(() => ({
    accounts, categories, suppliers, products, inventoryMovements, sales,
    transactions, budgets, savingsGoals, wishlist, assets, subscriptions, isLoaded,
    addTransaction, addTransactionsBatch, deleteTransaction, addProduct, addProductsBatch, updateProduct, deleteProduct,
    adjustStock, recordSale, updateSaleStatus,
    addAccount, updateAccount, deleteAccount, addBudget, updateBudget, deleteBudget, addSavingsGoal,
    updateSavingsGoal, deleteSavingsGoal, addWishlistItem, updateWishlistItem, deleteWishlistItem,
    addAsset, updateAsset, deleteAsset, addSupplier, deleteSupplier, addSubscription, updateSubscription,
    deleteSubscription, paySubscription, resetToDemoData, restoreFullBackup,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [accounts, categories, suppliers, products, inventoryMovements, sales, transactions, budgets, savingsGoals, wishlist, assets, subscriptions, isLoaded]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const c = useContext(StoreContext);
  if (!c) throw new Error('useStore must be used within StoreProvider');
  return c;
}
