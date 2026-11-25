'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Account, Category, Product, Supplier, Sale, Transaction,
  Budget, SavingsGoal, WishlistItem, Asset, InventoryMovement, Subscription, DebtRecord
} from '@/types';
import {
  INITIAL_ACCOUNTS, INITIAL_CATEGORIES, INITIAL_SUPPLIERS, INITIAL_PRODUCTS,
  INITIAL_INVENTORY_MOVEMENTS, INITIAL_SALES, INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS, INITIAL_SAVINGS_GOALS, INITIAL_WISHLIST, INITIAL_SUBSCRIPTIONS, INITIAL_DEBTS
} from '@/lib/seed-data';
import { getLocalDateString, getLocalTimestamp } from '@/lib/date';
import { validateBackupPayload } from '@/lib/validation';
import { loadStorageState, saveStorageState } from './local-storage-adapter';
import {
  applySaleToProducts, createInventoryMovement,
  cleanCategoryName, advanceNextBillingDate, deduplicateById,
  applyDeleteTransaction, applyUpdateTransaction, applySaleStatusUpdateSingle,
  applyDeleteSale, applyTransactionBalance, applyStockPurchase, generateSecureId
} from './store-handlers';
import { StoreContextType } from './store-types';

const StoreContext = createContext<StoreContextType | null>(null);

interface StoreState {
  accounts: Account[];
  categories: Category[];
  suppliers: Supplier[];
  products: Product[];
  inventoryMovements: InventoryMovement[];
  sales: Sale[];
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  wishlist: WishlistItem[];
  subscriptions: Subscription[];
  debts: DebtRecord[];
}

function getDemoState(): StoreState {
  return {
    accounts: INITIAL_ACCOUNTS,
    categories: INITIAL_CATEGORIES,
    suppliers: INITIAL_SUPPLIERS,
    products: INITIAL_PRODUCTS,
    inventoryMovements: INITIAL_INVENTORY_MOVEMENTS,
    sales: INITIAL_SALES,
    transactions: INITIAL_TRANSACTIONS,
    budgets: INITIAL_BUDGETS,
    savingsGoals: INITIAL_SAVINGS_GOALS,
    wishlist: INITIAL_WISHLIST,
    subscriptions: INITIAL_SUBSCRIPTIONS,
    debts: INITIAL_DEBTS,
  };
}

function getEmptyState(): StoreState {
  return {
    accounts: [],
    categories: INITIAL_CATEGORIES,
    suppliers: [],
    products: [],
    inventoryMovements: [],
    sales: [],
    transactions: [],
    budgets: [],
    savingsGoals: [],
    wishlist: [],
    subscriptions: [],
    debts: [],
  };
}

function deriveAssets(products: Product[]): Asset[] {
  return products
    .filter((p) => p.productType === 'asset' || p.productType === 'personal_collection')
    .map((p) => ({
      ...p,
      purchasePrice: p.purchasePrice ?? p.purchaseCost,
      currentEstimatedValue: p.currentEstimatedValue ?? p.sellingPrice,
      condition: p.condition || 'good',
      category: p.category || '',
    }));
}

function migrateLegacyAssets(
  loadedProducts: Product[],
  legacyAssets?: Array<Record<string, unknown>>
): Product[] {
  if (!legacyAssets || legacyAssets.length === 0) return loadedProducts;
  const existingIds = new Set(loadedProducts.map((p) => p.id));
  const nowIso = new Date().toISOString();
  const migrated: Product[] = [];

  for (const raw of legacyAssets) {
    const id = typeof raw.id === 'string' ? raw.id : '';
    if (!id || existingIds.has(id)) continue;
    const cost = Number(raw.purchasePrice ?? raw.purchaseCost ?? 0) || 0;
    const estVal = Number(raw.currentEstimatedValue ?? raw.sellingPrice ?? cost) || 0;
    migrated.push({
      id,
      sku: typeof raw.sku === 'string' ? raw.sku : `AST-${id.slice(-4)}`,
      name: typeof raw.name === 'string' ? raw.name : 'Unnamed Asset',
      brand: typeof raw.brand === 'string' ? raw.brand : '',
      categoryId: typeof raw.categoryId === 'string' ? raw.categoryId : undefined,
      subCategoryId: typeof raw.subCategoryId === 'string' ? raw.subCategoryId : undefined,
      category: cleanCategoryName(typeof raw.category === 'string' ? raw.category : ''),
      purchaseCost: cost,
      purchasePrice: cost,
      sellingPrice: estVal,
      currentEstimatedValue: estVal,
      condition: (raw.condition as Asset['condition']) || 'good',
      productType: 'asset',
      stockOnHand: 1,
      stockReserved: 0,
      stockSold: 0,
      minStockAlert: 0,
      status: 'active',
      imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : undefined,
      notes: typeof raw.notes === 'string' ? raw.notes : typeof raw.description === 'string' ? raw.description : '',
      description: typeof raw.description === 'string' ? raw.description : typeof raw.notes === 'string' ? raw.notes : '',
      purchaseDate: typeof raw.purchaseDate === 'string' ? raw.purchaseDate : undefined,
      createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : nowIso,
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : nowIso,
    });
  }
  return [...loadedProducts, ...migrated];
}

function mergeDefaultSubcategoriesIfMissing(loadedCategories: Category[]): Category[] {
  const hasAnySubcategory = loadedCategories.some((c) => Boolean(c.parentId));
  if (hasAnySubcategory) return loadedCategories;

  const existingIds = new Set(loadedCategories.map((c) => c.id));
  const defaultSubsToAdd = INITIAL_CATEGORIES.filter(
    (c) => c.parentId && existingIds.has(c.parentId) && !existingIds.has(c.id)
  );
  return [...loadedCategories, ...defaultSubsToAdd];
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [state, setState] = useState<StoreState>(getDemoState);
  const stateRef = useRef<StoreState>(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // IndexedDB + LocalStorage load & migration
  useEffect(() => {
    loadStorageState().then((s) => {
      if (s) {
        const base = getDemoState();
        const loadedCategories = s.categories
          ? mergeDefaultSubcategoriesIfMissing(
              deduplicateById(s.categories).map((c) => ({ ...c, name: cleanCategoryName(c.name) }))
            )
          : base.categories;
        const baseProducts = s.products ? deduplicateById(s.products) : base.products;
        const loadedProducts = migrateLegacyAssets(
          baseProducts,
          s.assets as unknown as Array<Record<string, unknown>> | undefined
        );

        const nextState: StoreState = {
          accounts: s.accounts ? deduplicateById(s.accounts) : base.accounts,
          categories: loadedCategories,
          suppliers: s.suppliers ? deduplicateById(s.suppliers) : base.suppliers,
          products: loadedProducts,
          inventoryMovements: s.inventoryMovements ? deduplicateById(s.inventoryMovements) : base.inventoryMovements,
          sales: s.sales ? deduplicateById(s.sales) : base.sales,
          transactions: s.transactions ? deduplicateById(s.transactions) : base.transactions,
          budgets: s.budgets ? deduplicateById(s.budgets) : base.budgets,
          savingsGoals: s.savingsGoals ? deduplicateById(s.savingsGoals) : base.savingsGoals,
          wishlist: s.wishlist ? deduplicateById(s.wishlist) : base.wishlist,
          subscriptions: s.subscriptions ? deduplicateById(s.subscriptions) : base.subscriptions,
          debts: s.debts ? deduplicateById(s.debts) : [],
        };
        stateRef.current = nextState;
        setState(nextState);
      }
      setIsLoaded(true);
    });
  }, []);

  // Debounced persistence (250ms)
  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => {
      const assets = deriveAssets(state.products);
      saveStorageState({
        ...state,
        assets,
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [isLoaded, state]);

  const assets: Asset[] = useMemo(() => deriveAssets(state.products), [state.products]);

  const addTransaction = useCallback((trx: Omit<Transaction, 'id' | 'createdAt'>): Transaction => {
    const nowIso = new Date().toISOString();
    const ts = getLocalTimestamp();
    const trxId = generateSecureId('trx');
    let referenceId = trx.referenceId;
    let extraProduct: Product | null = null;
    let extraMovement: InventoryMovement | null = null;

    const currentCategories = stateRef.current.categories;
    const catObj = currentCategories.find((c) => c.id === trx.categoryId);

    if (trx.itemAction === 'collect') {
      const astId = generateSecureId('ast');
      referenceId = astId;
      extraProduct = {
        id: astId,
        sku: `COL-${Date.now().toString().slice(-4)}`,
        name: trx.description,
        brand: trx.itemBrand || 'Collection',
        categoryId: trx.categoryId,
        subCategoryId: trx.subCategoryId,
        category: catObj?.name || 'Collection',
        purchaseCost: trx.amount,
        purchasePrice: trx.amount,
        sellingPrice: trx.amount,
        currentEstimatedValue: trx.amount,
        condition: trx.itemCondition || 'mint',
        productType: 'asset',
        stockOnHand: 1,
        stockReserved: 0,
        stockSold: 0,
        minStockAlert: 0,
        status: 'active',
        purchaseDate: trx.date,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
    } else if (trx.itemAction === 'sell') {
      const prodId = generateSecureId('prod');
      referenceId = prodId;
      extraProduct = {
        id: prodId,
        sku: `SKU-${Date.now().toString().slice(-4)}`,
        name: trx.description,
        brand: trx.itemBrand || 'Generic',
        categoryId: trx.categoryId,
        subCategoryId: trx.subCategoryId,
        category: catObj?.name || 'Product',
        purchaseCost: trx.amount,
        sellingPrice: trx.amount,
        productType: 'regular_inventory',
        stockOnHand: 1,
        stockReserved: 0,
        stockSold: 0,
        minStockAlert: 1,
        status: 'active',
        createdAt: getLocalDateString(),
        updatedAt: getLocalDateString(),
      };
      extraMovement = createInventoryMovement(
        prodId,
        'purchase_in',
        1,
        `Stock purchase via transaction #${trxId}`,
        trxId,
        0,
        1,
        ts
      );
    }

    const newTrx: Transaction = {
      ...trx,
      id: trxId,
      referenceId,
      createdAt: nowIso,
    };

    setState((prev) => ({
      ...prev,
      transactions: [newTrx, ...prev.transactions],
      accounts: applyTransactionBalance(prev.accounts, newTrx, 1, nowIso),
      products: extraProduct ? [extraProduct, ...prev.products] : prev.products,
      inventoryMovements: extraMovement ? [extraMovement, ...prev.inventoryMovements] : prev.inventoryMovements,
    }));

    return newTrx;
  }, []);

  const addTransactionsBatch = useCallback((trxs: Omit<Transaction, 'id' | 'createdAt'>[]) => {
    if (trxs.length === 0) return;
    const nowIso = new Date().toISOString();
    const newTrxs: Transaction[] = trxs.map((t) => ({
      ...t,
      id: generateSecureId('trx'),
      createdAt: nowIso,
    }));

    const balanceDeltas = new Map<string, number>();
    for (const trx of trxs) {
      const delta = trx.type === 'income' ? trx.amount : -trx.amount;
      balanceDeltas.set(trx.accountId, (balanceDeltas.get(trx.accountId) || 0) + delta);
      if (trx.type === 'transfer' && trx.toAccountId) {
        balanceDeltas.set(trx.toAccountId, (balanceDeltas.get(trx.toAccountId) || 0) + trx.amount);
      }
    }

    setState((prev) => ({
      ...prev,
      transactions: [...newTrxs, ...prev.transactions],
      accounts: prev.accounts.map((acc) => {
        const delta = balanceDeltas.get(acc.id);
        if (delta !== undefined && delta !== 0) {
          return { ...acc, balance: acc.balance + delta, updatedAt: nowIso };
        }
        return acc;
      }),
    }));
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
    const nowIso = new Date().toISOString();
    setState((prev) => {
      const { updatedTransactions, updatedAccounts } = applyUpdateTransaction(
        prev.transactions,
        prev.accounts,
        id,
        updates,
        nowIso
      );
      return {
        ...prev,
        transactions: updatedTransactions,
        accounts: updatedAccounts,
      };
    });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    const nowIso = new Date().toISOString();
    setState((prev) => {
      const { updatedTransactions, updatedAccounts, deletedTransaction } = applyDeleteTransaction(
        prev.transactions,
        prev.accounts,
        id,
        nowIso
      );

      let updatedProducts = prev.products;
      let updatedMovements = prev.inventoryMovements;
      if (
        deletedTransaction &&
        (deletedTransaction.itemAction === 'collect' || deletedTransaction.itemAction === 'sell') &&
        deletedTransaction.referenceId
      ) {
        const linkedProd = prev.products.find((p) => p.id === deletedTransaction.referenceId);
        if (linkedProd && (linkedProd.stockSold || 0) === 0) {
          updatedProducts = prev.products.filter((p) => p.id !== linkedProd.id);
          updatedMovements = prev.inventoryMovements.filter((m) => m.productId !== linkedProd.id);
        }
      }

      return {
        ...prev,
        transactions: updatedTransactions,
        accounts: updatedAccounts,
        products: updatedProducts,
        inventoryMovements: updatedMovements,
      };
    });
  }, []);

  const addProduct = useCallback(
    (p: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stockSold' | 'stockReserved'>) => {
      const id = generateSecureId('prod');
      const today = getLocalDateString();
      const ts = getLocalTimestamp();
      const newP: Product = { ...p, id, stockSold: 0, stockReserved: 0, createdAt: today, updatedAt: today };
      const initialMov =
        p.stockOnHand > 0
          ? createInventoryMovement(id, 'adjustment_in', p.stockOnHand, 'Initial stock', undefined, 0, p.stockOnHand, ts)
          : null;

      setState((prev) => ({
        ...prev,
        products: [newP, ...prev.products],
        inventoryMovements: initialMov ? [initialMov, ...prev.inventoryMovements] : prev.inventoryMovements,
      }));
      return newP;
    },
    []
  );

  const addProductsBatch = useCallback(
    (prods: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stockSold' | 'stockReserved'>[]) => {
      if (prods.length === 0) return;
      const today = getLocalDateString();
      const ts = getLocalTimestamp();
      const newProducts: Product[] = [];
      const newMovements: InventoryMovement[] = [];

      for (const p of prods) {
        const id = generateSecureId('prod');
        newProducts.push({ ...p, id, stockSold: 0, stockReserved: 0, createdAt: today, updatedAt: today });
        if (p.stockOnHand > 0) {
          newMovements.push(
            createInventoryMovement(id, 'adjustment_in', p.stockOnHand, 'Initial stock import', undefined, 0, p.stockOnHand, ts)
          );
        }
      }

      setState((prev) => ({
        ...prev,
        products: [...newProducts, ...prev.products],
        inventoryMovements:
          newMovements.length > 0 ? [...newMovements, ...prev.inventoryMovements] : prev.inventoryMovements,
      }));
    },
    []
  );

  const updateProduct = useCallback((id: string, u: Partial<Product>) => {
    const nowIso = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      products: prev.products.map((i) => (i.id === id ? { ...i, ...u, updatedAt: nowIso } : i)),
    }));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.filter((i) => i.id !== id),
    }));
  }, []);

  const adjustStock = useCallback(
    (productId: string, quantityChange: number, type: InventoryMovement['type'], notes: string) => {
      const nowIso = new Date().toISOString();
      const ts = getLocalTimestamp();
      setState((prev) => {
        const target = prev.products.find((p) => p.id === productId);
        if (!target) return prev;
        const prevStock = target.stockOnHand;
        const newStock = Math.max(0, prevStock + quantityChange);
        const mov = createInventoryMovement(productId, type, quantityChange, notes, undefined, prevStock, newStock, ts);
        return {
          ...prev,
          products: prev.products.map((prod) =>
            prod.id === productId ? { ...prod, stockOnHand: newStock, updatedAt: nowIso } : prod
          ),
          inventoryMovements: [mov, ...prev.inventoryMovements],
        };
      });
    },
    []
  );

  const recordStockPurchase = useCallback(
    (params: {
      productId: string;
      quantity: number;
      unitCost: number;
      supplierId?: string;
      paymentAccountId?: string;
      date?: string;
      notes?: string;
    }) => {
      const nowIso = new Date().toISOString();
      const ts = getLocalTimestamp();
      const date = params.date || getLocalDateString();
      setState((prev) => {
        const res = applyStockPurchase(prev.products, prev.accounts, prev.transactions, {
          ...params,
          date,
          nowIso,
          timestamp: ts,
        });
        return {
          ...prev,
          products: res.updatedProducts,
          accounts: res.updatedAccounts,
          transactions: res.updatedTransactions,
          inventoryMovements: res.movement ? [res.movement, ...prev.inventoryMovements] : prev.inventoryMovements,
        };
      });
    },
    []
  );

  const recordSale = useCallback(
    (s: Omit<Sale, 'id' | 'createdAt' | 'orderNumber'> & { orderNumber?: string }) => {
      const saleId = generateSecureId('sale');
      const orderNumber = s.orderNumber || `ORD-${Date.now().toString().slice(-6)}`;
      const nowIso = new Date().toISOString();
      const ts = getLocalTimestamp();
      const newSale: Sale = { ...s, id: saleId, orderNumber, createdAt: nowIso };

      setState((prev) => {
        const { updatedProducts, movements } = applySaleToProducts(prev.products, newSale, nowIso, ts);

        let nextTransactions = prev.transactions;
        let nextAccounts = prev.accounts;
        if (newSale.paymentAccountId && newSale.paymentStatus === 'paid') {
          const netReceived = Math.max(0, newSale.grossSales - newSale.marketplaceFees - newSale.discounts);
          const saleTrx: Transaction = {
            id: generateSecureId('trx'),
            date: newSale.saleDate,
            scope: 'business',
            type: 'income',
            amount: netReceived,
            accountId: newSale.paymentAccountId,
            sourceModule: 'business_sale',
            referenceId: saleId,
            description: `Sale ${newSale.channel.toUpperCase()} #${orderNumber}`,
            createdAt: nowIso,
          };
          nextTransactions = [saleTrx, ...prev.transactions];
          nextAccounts = applyTransactionBalance(prev.accounts, saleTrx, 1, nowIso);
        }

        return {
          ...prev,
          sales: [newSale, ...prev.sales],
          products: updatedProducts,
          inventoryMovements: movements.length > 0 ? [...movements, ...prev.inventoryMovements] : prev.inventoryMovements,
          transactions: nextTransactions,
          accounts: nextAccounts,
        };
      });

      return newSale;
    },
    []
  );

  const updateSaleStatus = useCallback((saleId: string, newStatus: Sale['orderStatus']) => {
    const nowIso = new Date().toISOString();
    const ts = getLocalTimestamp();
    setState((prev) => {
      const result = applySaleStatusUpdateSingle(prev.sales, prev.products, saleId, newStatus, nowIso, ts);
      let nextTransactions = prev.transactions;
      let nextAccounts = prev.accounts;

      if (result.cancelledPaidSaleIds.length > 0) {
        const cancelledSet = new Set(result.cancelledPaidSaleIds);
        const linkedTrxIds = prev.transactions
          .filter((t) => t.referenceId && cancelledSet.has(t.referenceId) && t.sourceModule === 'business_sale')
          .map((t) => t.id);

        for (const trxId of linkedTrxIds) {
          const delRes = applyDeleteTransaction(nextTransactions, nextAccounts, trxId, nowIso);
          nextTransactions = delRes.updatedTransactions;
          nextAccounts = delRes.updatedAccounts;
        }
      }

      return {
        ...prev,
        sales: result.updatedSales,
        products: result.updatedProducts,
        inventoryMovements:
          result.movements.length > 0 ? [...result.movements, ...prev.inventoryMovements] : prev.inventoryMovements,
        transactions: nextTransactions,
        accounts: nextAccounts,
      };
    });
  }, []);

  const settleSalePayment = useCallback((saleId: string, accountId: string, date?: string) => {
    const nowIso = new Date().toISOString();
    const payDate = date || getLocalDateString();
    setState((prev) => {
      const targetSale = prev.sales.find((s) => s.id === saleId);
      if (!targetSale || targetSale.paymentStatus === 'paid') return prev;
      if (targetSale.orderStatus === 'cancelled' || targetSale.orderStatus === 'returned') return prev;

      const netReceived = Math.max(0, targetSale.grossSales - targetSale.marketplaceFees - targetSale.discounts);
      const saleTrx: Transaction = {
        id: generateSecureId('trx'),
        date: payDate,
        scope: 'business',
        type: 'income',
        amount: netReceived,
        accountId,
        sourceModule: 'business_sale',
        referenceId: saleId,
        description: `Settlement ${targetSale.channel.toUpperCase()} #${targetSale.orderNumber}`,
        createdAt: nowIso,
      };

      return {
        ...prev,
        sales: prev.sales.map((s) =>
          s.id === saleId ? { ...s, paymentStatus: 'paid', paymentAccountId: accountId } : s
        ),
        transactions: [saleTrx, ...prev.transactions],
        accounts: applyTransactionBalance(prev.accounts, saleTrx, 1, nowIso),
      };
    });
  }, []);

  const deleteSale = useCallback((saleId: string) => {
    const nowIso = new Date().toISOString();
    const ts = getLocalTimestamp();
    setState((prev) => {
      const res = applyDeleteSale(prev.sales, prev.products, prev.transactions, prev.accounts, saleId, nowIso, ts);
      return {
        ...prev,
        sales: res.updatedSales,
        products: res.updatedProducts,
        transactions: res.updatedTransactions,
        accounts: res.updatedAccounts,
        inventoryMovements:
          res.movements.length > 0 ? [...res.movements, ...prev.inventoryMovements] : prev.inventoryMovements,
      };
    });
  }, []);

  const addAccount = useCallback((a: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    const nowIso = new Date().toISOString();
    const newA: Account = { ...a, id: generateSecureId('acc'), createdAt: nowIso, updatedAt: nowIso };
    setState((prev) => ({ ...prev, accounts: [...prev.accounts, newA] }));
    return newA;
  }, []);

  const updateAccount = useCallback(
    (id: string, u: Partial<Account>, options?: { recordAdjustment?: boolean }) => {
      const nowIso = new Date().toISOString();
      const today = getLocalDateString();
      setState((prev) => {
        const target = prev.accounts.find((a) => a.id === id);
        if (!target) return prev;

        let nextTransactions = prev.transactions;
        if (options?.recordAdjustment && typeof u.balance === 'number' && u.balance !== target.balance) {
          const diff = u.balance - target.balance;
          const adjTrx: Transaction = {
            id: generateSecureId('trx'),
            date: today,
            scope: 'personal',
            type: diff > 0 ? 'income' : 'expense',
            amount: Math.abs(diff),
            accountId: id,
            sourceModule: 'balance_adjustment',
            description: `Balance Adjustment: ${u.name || target.name}`,
            notes: `Adjusted from ${target.balance} to ${u.balance}`,
            createdAt: nowIso,
          };
          nextTransactions = [adjTrx, ...prev.transactions];
        }

        return {
          ...prev,
          accounts: prev.accounts.map((a) => (a.id === id ? { ...a, ...u, updatedAt: nowIso } : a)),
          transactions: nextTransactions,
        };
      });
    },
    []
  );

  const deleteAccount = useCallback((id: string) => {
    setState((prev) => ({ ...prev, accounts: prev.accounts.filter((a) => a.id !== id) }));
  }, []);

  const updateCashBreakdown = useCallback(
    (accountId: string, breakdown: Record<number, number>, options?: { recordAdjustment?: boolean }) => {
      let total = 0;
      for (const [nominalStr, count] of Object.entries(breakdown)) {
        const nominal = Number(nominalStr);
        const qty = Math.max(0, Number(count) || 0);
        total += nominal * qty;
      }
      const nowIso = new Date().toISOString();
      const today = getLocalDateString();

      setState((prev) => {
        const target = prev.accounts.find((a) => a.id === accountId);
        if (!target) return prev;

        let nextTransactions = prev.transactions;
        const diff = total - target.balance;
        if (options?.recordAdjustment && diff !== 0) {
          const adjTrx: Transaction = {
            id: generateSecureId('trx'),
            date: today,
            scope: 'personal',
            type: diff > 0 ? 'income' : 'expense',
            amount: Math.abs(diff),
            accountId,
            sourceModule: 'balance_adjustment',
            description: `Cash Count Adjustment: ${target.name}`,
            notes: `Physical cash counted ${total} (prev ${target.balance})`,
            createdAt: nowIso,
          };
          nextTransactions = [adjTrx, ...prev.transactions];
        }

        return {
          ...prev,
          accounts: prev.accounts.map((acc) =>
            acc.id === accountId ? { ...acc, cashBreakdown: breakdown, balance: total, updatedAt: nowIso } : acc
          ),
          transactions: nextTransactions,
        };
      });
    },
    []
  );

  const addCategory = useCallback((c: Omit<Category, 'id'>) => {
    const newC: Category = { ...c, id: generateSecureId(c.parentId ? 'sub' : 'cat') };
    setState((prev) => ({ ...prev, categories: [...prev.categories, newC] }));
    return newC;
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id && c.parentId !== id),
    }));
  }, []);

  const addBudget = useCallback((b: Omit<Budget, 'id'>) => {
    const newB: Budget = { ...b, id: generateSecureId('bgt') };
    setState((prev) => ({ ...prev, budgets: [...prev.budgets, newB] }));
    return newB;
  }, []);

  const updateBudget = useCallback((id: string, u: Partial<Budget>) => {
    setState((prev) => ({
      ...prev,
      budgets: prev.budgets.map((b) => (b.id === id ? { ...b, ...u } : b)),
    }));
  }, []);

  const deleteBudget = useCallback((id: string) => {
    setState((prev) => ({ ...prev, budgets: prev.budgets.filter((b) => b.id !== id) }));
  }, []);

  const addSavingsGoal = useCallback((g: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    const newG: SavingsGoal = { ...g, id: generateSecureId('svg'), createdAt: new Date().toISOString() };
    setState((prev) => ({ ...prev, savingsGoals: [...prev.savingsGoals, newG] }));
    return newG;
  }, []);

  const updateSavingsGoal = useCallback((id: string, u: Partial<SavingsGoal>) => {
    setState((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map((g) => (g.id === id ? { ...g, ...u } : g)),
    }));
  }, []);

  const depositToSavingsGoal = useCallback(
    (goalId: string, amount: number, accountId?: string, date?: string) => {
      if (amount <= 0) return;
      const nowIso = new Date().toISOString();
      const trxDate = date || getLocalDateString();
      setState((prev) => {
        const goal = prev.savingsGoals.find((g) => g.id === goalId);
        if (!goal) return prev;

        let nextTransactions = prev.transactions;
        let nextAccounts = prev.accounts;
        if (accountId) {
          const trx: Transaction = {
            id: generateSecureId('trx'),
            date: trxDate,
            scope: 'personal',
            type: 'expense',
            amount,
            accountId,
            sourceModule: 'personal_expense',
            referenceId: goalId,
            description: `Savings Goal Deposit: ${goal.name}`,
            createdAt: nowIso,
          };
          nextTransactions = [trx, ...prev.transactions];
          nextAccounts = applyTransactionBalance(prev.accounts, trx, 1, nowIso);
        }

        return {
          ...prev,
          savingsGoals: prev.savingsGoals.map((g) =>
            g.id === goalId ? { ...g, currentAmount: (g.currentAmount || 0) + amount } : g
          ),
          transactions: nextTransactions,
          accounts: nextAccounts,
        };
      });
    },
    []
  );

  const deleteSavingsGoal = useCallback((id: string) => {
    setState((prev) => ({ ...prev, savingsGoals: prev.savingsGoals.filter((g) => g.id !== id) }));
  }, []);

  const addWishlistItem = useCallback((w: Omit<WishlistItem, 'id' | 'createdAt'>) => {
    const newW: WishlistItem = { ...w, id: generateSecureId('wsh'), createdAt: new Date().toISOString() };
    setState((prev) => ({ ...prev, wishlist: [newW, ...prev.wishlist] }));
    return newW;
  }, []);

  const updateWishlistItem = useCallback((id: string, u: Partial<WishlistItem>) => {
    setState((prev) => ({
      ...prev,
      wishlist: prev.wishlist.map((w) => (w.id === id ? { ...w, ...u } : w)),
    }));
  }, []);

  const deleteWishlistItem = useCallback((id: string) => {
    setState((prev) => ({ ...prev, wishlist: prev.wishlist.filter((w) => w.id !== id) }));
  }, []);

  const addAsset = useCallback(
    (a: Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'sku'> & { sku?: string }, paymentAccountId?: string): Asset => {
      const nowIso = new Date().toISOString();
      const today = getLocalDateString();
      const cost = Number(a.purchaseCost ?? a.purchasePrice) || 0;
      const estVal = Number(a.sellingPrice ?? a.currentEstimatedValue) || cost;
      const newA: Asset = {
        ...a,
        id: generateSecureId('ast'),
        sku: a.sku || `AST-${Date.now().toString().slice(-4)}`,
        name: a.name || '',
        brand: a.brand || '',
        categoryId: a.categoryId,
        subCategoryId: a.subCategoryId,
        category: a.category || '',
        purchaseCost: cost,
        purchasePrice: cost,
        sellingPrice: estVal,
        currentEstimatedValue: estVal,
        condition: a.condition || 'good',
        productType: 'asset',
        stockOnHand: 1,
        stockReserved: 0,
        stockSold: 0,
        minStockAlert: 0,
        status: 'active',
        imageUrl: a.imageUrl,
        notes: a.notes || a.description || '',
        description: a.description || a.notes || '',
        purchaseDate: a.purchaseDate || today,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      setState((prev) => {
        let nextTransactions = prev.transactions;
        let nextAccounts = prev.accounts;
        if (paymentAccountId && cost > 0) {
          const trx: Transaction = {
            id: generateSecureId('trx'),
            date: newA.purchaseDate || today,
            scope: 'personal',
            type: 'expense',
            amount: cost,
            accountId: paymentAccountId,
            categoryId: newA.categoryId,
            subCategoryId: newA.subCategoryId,
            sourceModule: 'personal_expense',
            description: `Collectible Asset: ${newA.name}`,
            referenceId: newA.id,
            createdAt: nowIso,
          };
          nextTransactions = [trx, ...prev.transactions];
          nextAccounts = applyTransactionBalance(prev.accounts, trx, 1, nowIso);
        }

        return {
          ...prev,
          products: [newA, ...prev.products],
          transactions: nextTransactions,
          accounts: nextAccounts,
        };
      });

      return newA;
    },
    []
  );

  const updateAsset = useCallback((id: string, u: Partial<Asset>) => {
    const nowIso = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.id !== id) return p;
        const cost = u.purchaseCost ?? u.purchasePrice ?? p.purchaseCost;
        const estVal = u.sellingPrice ?? u.currentEstimatedValue ?? p.sellingPrice;
        return {
          ...p,
          ...u,
          purchaseCost: cost,
          purchasePrice: cost,
          sellingPrice: estVal,
          currentEstimatedValue: estVal,
          notes: u.notes ?? u.description ?? p.notes,
          description: u.description ?? u.notes ?? p.description,
          updatedAt: nowIso,
        };
      }),
    }));
  }, []);

  const deleteAsset = useCallback((id: string) => {
    setState((prev) => ({ ...prev, products: prev.products.filter((p) => p.id !== id) }));
  }, []);

  const transferCollectionToSeller = useCallback((assetId: string, sellingPrice: number, sku?: string) => {
    const nowIso = new Date().toISOString();
    const ts = getLocalTimestamp();
    setState((prev) => {
      const target = prev.products.find((p) => p.id === assetId);
      if (!target) return prev;
      const newSku =
        sku || (target.sku.startsWith('AST') || target.sku.startsWith('COL') ? `SKU-${Date.now().toString().slice(-4)}` : target.sku);
      const mov = createInventoryMovement(
        assetId,
        'adjustment_in',
        1,
        `Transferred from Collection (${target.sku}) to Seller (${newSku})`,
        assetId,
        0,
        1,
        ts
      );
      return {
        ...prev,
        products: prev.products.map((p) =>
          p.id !== assetId
            ? p
            : {
                ...p,
                productType: 'preloved',
                sellingPrice: Number(sellingPrice) || p.sellingPrice || p.purchaseCost,
                sku: newSku,
                status: 'active',
                stockOnHand: 1,
                minStockAlert: 1,
                updatedAt: nowIso,
              }
        ),
        inventoryMovements: [mov, ...prev.inventoryMovements],
      };
    });
  }, []);

  const addSupplier = useCallback((s: Omit<Supplier, 'id' | 'createdAt'>) => {
    const newS: Supplier = { ...s, id: generateSecureId('sup'), createdAt: new Date().toISOString() };
    setState((prev) => ({ ...prev, suppliers: [...prev.suppliers, newS] }));
    return newS;
  }, []);

  const updateSupplier = useCallback((id: string, updates: Partial<Supplier>) => {
    setState((prev) => ({
      ...prev,
      suppliers: prev.suppliers.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  }, []);

  const deleteSupplier = useCallback((id: string) => {
    setState((prev) => ({ ...prev, suppliers: prev.suppliers.filter((s) => s.id !== id) }));
  }, []);

  const addSubscription = useCallback((s: Omit<Subscription, 'id' | 'createdAt'>) => {
    const newS: Subscription = { ...s, id: generateSecureId('sub'), createdAt: new Date().toISOString() };
    setState((prev) => ({ ...prev, subscriptions: [...prev.subscriptions, newS] }));
    return newS;
  }, []);

  const updateSubscription = useCallback((id: string, u: Partial<Subscription>) => {
    setState((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions.map((s) => (s.id === id ? { ...s, ...u } : s)),
    }));
  }, []);

  const deleteSubscription = useCallback((id: string) => {
    setState((prev) => ({ ...prev, subscriptions: prev.subscriptions.filter((s) => s.id !== id) }));
  }, []);

  const paySubscription = useCallback(
    (id: string, paymentDetails?: { accountId?: string; date?: string; amount?: number }) => {
      const nowIso = new Date().toISOString();
      const payDate = paymentDetails?.date || getLocalDateString();
      setState((prev) => {
        const sub = prev.subscriptions.find((s) => s.id === id);
        if (!sub) return prev;
        const amount = paymentDetails?.amount ?? sub.amount;
        const accountId = paymentDetails?.accountId || sub.accountId;

        const trx: Transaction = {
          id: generateSecureId('trx'),
          date: payDate,
          scope: 'personal',
          type: 'expense',
          amount,
          accountId,
          categoryId: sub.categoryId,
          subCategoryId: sub.subCategoryId,
          sourceModule: 'personal_expense',
          description: `Subscription: ${sub.name}`,
          isRecurring: true,
          createdAt: nowIso,
        };

        return {
          ...prev,
          transactions: [trx, ...prev.transactions],
          accounts: applyTransactionBalance(prev.accounts, trx, 1, nowIso),
          subscriptions: prev.subscriptions.map((s) =>
            s.id !== id
              ? s
              : { ...s, nextBillingDate: advanceNextBillingDate(s.nextBillingDate || payDate, s.billingCycle) }
          ),
        };
      });
    },
    []
  );

  const addDebt = useCallback((d: Omit<DebtRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const nowIso = new Date().toISOString();
    const newDebt: DebtRecord = { ...d, id: generateSecureId('dbt'), createdAt: nowIso, updatedAt: nowIso };
    setState((prev) => ({ ...prev, debts: [newDebt, ...prev.debts] }));
    return newDebt;
  }, []);

  const updateDebt = useCallback((id: string, updates: Partial<DebtRecord>) => {
    const nowIso = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      debts: prev.debts.map((d) => (d.id === id ? { ...d, ...updates, updatedAt: nowIso } : d)),
    }));
  }, []);

  const recordDebtPayment = useCallback((debtId: string, amount: number, accountId?: string, date?: string) => {
    if (amount <= 0) return;
    const nowIso = new Date().toISOString();
    const payDate = date || getLocalDateString();
    setState((prev) => {
      const debt = prev.debts.find((d) => d.id === debtId);
      if (!debt) return prev;
      const remaining = Math.max(0, debt.totalAmount - debt.paidAmount);
      const actualPay = Math.min(amount, remaining);
      if (actualPay <= 0) return prev;

      const nextPaid = debt.paidAmount + actualPay;
      const isSettled = nextPaid >= debt.totalAmount;

      let nextTransactions = prev.transactions;
      let nextAccounts = prev.accounts;
      if (accountId) {
        const trx: Transaction = {
          id: generateSecureId('trx'),
          date: payDate,
          scope: 'personal',
          type: debt.direction === 'receivable' ? 'income' : 'expense',
          amount: actualPay,
          accountId,
          sourceModule: 'debt_settlement',
          referenceId: debtId,
          description: `${debt.direction === 'receivable' ? 'Receivable Collected' : 'Debt Payment'}: ${debt.title}`,
          createdAt: nowIso,
        };
        nextTransactions = [trx, ...prev.transactions];
        nextAccounts = applyTransactionBalance(prev.accounts, trx, 1, nowIso);
      }

      return {
        ...prev,
        debts: prev.debts.map((d) =>
          d.id === debtId
            ? { ...d, paidAmount: nextPaid, status: isSettled ? 'settled' : 'open', updatedAt: nowIso }
            : d
        ),
        transactions: nextTransactions,
        accounts: nextAccounts,
      };
    });
  }, []);

  const deleteDebt = useCallback((id: string) => {
    setState((prev) => ({ ...prev, debts: prev.debts.filter((d) => d.id !== id) }));
  }, []);

  const resetToDemoData = useCallback(() => {
    const demo = getDemoState();
    saveStorageState({ ...demo, assets: deriveAssets(demo.products) });
    stateRef.current = demo;
    setState(demo);
  }, []);

  const deleteAllData = useCallback(() => {
    const empty = getEmptyState();
    saveStorageState({ ...empty, assets: [] });
    stateRef.current = empty;
    setState(empty);
  }, []);

  const restoreFullBackupDetailed = useCallback((raw: unknown): { ok: boolean; error?: string } => {
    const validation = validateBackupPayload(raw);
    if (!validation.ok) {
      return { ok: false, error: validation.error };
    }

    const data = validation.data;
    const baseProducts = data.products ? deduplicateById(data.products as Product[]) : [];
    const productsWithAssets = migrateLegacyAssets(baseProducts, data.assets);

    const restored: StoreState = {
      accounts: data.accounts ? deduplicateById(data.accounts as Account[]) : [],
      categories: data.categories
        ? deduplicateById(data.categories as Category[]).map((c) => ({ ...c, name: cleanCategoryName(c.name) }))
        : INITIAL_CATEGORIES,
      suppliers: data.suppliers ? deduplicateById(data.suppliers as Supplier[]) : [],
      products: productsWithAssets,
      inventoryMovements: data.inventoryMovements ? deduplicateById(data.inventoryMovements as InventoryMovement[]) : [],
      sales: data.sales ? deduplicateById(data.sales as Sale[]) : [],
      transactions: data.transactions ? deduplicateById(data.transactions as Transaction[]) : [],
      budgets: data.budgets ? deduplicateById(data.budgets as Budget[]) : [],
      savingsGoals: data.savingsGoals ? deduplicateById(data.savingsGoals as SavingsGoal[]) : [],
      wishlist: data.wishlist ? deduplicateById(data.wishlist as WishlistItem[]) : [],
      subscriptions: data.subscriptions ? deduplicateById(data.subscriptions as Subscription[]) : [],
      debts: data.debts ? deduplicateById(data.debts as DebtRecord[]) : [],
    };

    setState(restored);
    return { ok: true };
  }, []);

  const restoreFullBackup = useCallback(
    (raw: unknown): boolean => {
      return restoreFullBackupDetailed(raw).ok;
    },
    [restoreFullBackupDetailed]
  );

  const value = useMemo<StoreContextType>(
    () => ({
      accounts: state.accounts,
      pockets: state.accounts,
      categories: state.categories,
      suppliers: state.suppliers,
      products: state.products,
      inventoryMovements: state.inventoryMovements,
      sales: state.sales,
      transactions: state.transactions,
      budgets: state.budgets,
      savingsGoals: state.savingsGoals,
      wishlist: state.wishlist,
      assets,
      subscriptions: state.subscriptions,
      debts: state.debts,
      isLoaded,
      addTransaction,
      addTransactionsBatch,
      updateTransaction,
      deleteTransaction,
      addProduct,
      addProductsBatch,
      updateProduct,
      deleteProduct,
      adjustStock,
      recordStockPurchase,
      recordSale,
      updateSaleStatus,
      settleSalePayment,
      deleteSale,
      addAccount,
      updateAccount,
      deleteAccount,
      updateCashBreakdown,
      addCategory,
      updateCategory,
      deleteCategory,
      addBudget,
      updateBudget,
      deleteBudget,
      addSavingsGoal,
      updateSavingsGoal,
      depositToSavingsGoal,
      deleteSavingsGoal,
      addWishlistItem,
      updateWishlistItem,
      deleteWishlistItem,
      addAsset,
      updateAsset,
      deleteAsset,
      transferCollectionToSeller,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addSubscription,
      updateSubscription,
      deleteSubscription,
      paySubscription,
      addDebt,
      updateDebt,
      recordDebtPayment,
      deleteDebt,
      resetToDemoData,
      deleteAllData,
      restoreFullBackup,
      restoreFullBackupDetailed,
    }),
    [
      state,
      assets,
      isLoaded,
      addTransaction,
      addTransactionsBatch,
      updateTransaction,
      deleteTransaction,
      addProduct,
      addProductsBatch,
      updateProduct,
      deleteProduct,
      adjustStock,
      recordStockPurchase,
      recordSale,
      updateSaleStatus,
      settleSalePayment,
      deleteSale,
      addAccount,
      updateAccount,
      deleteAccount,
      updateCashBreakdown,
      addCategory,
      updateCategory,
      deleteCategory,
      addBudget,
      updateBudget,
      deleteBudget,
      addSavingsGoal,
      updateSavingsGoal,
      depositToSavingsGoal,
      deleteSavingsGoal,
      addWishlistItem,
      updateWishlistItem,
      deleteWishlistItem,
      addAsset,
      updateAsset,
      deleteAsset,
      transferCollectionToSeller,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addSubscription,
      updateSubscription,
      deleteSubscription,
      paySubscription,
      addDebt,
      updateDebt,
      recordDebtPayment,
      deleteDebt,
      resetToDemoData,
      deleteAllData,
      restoreFullBackup,
      restoreFullBackupDetailed,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const c = useContext(StoreContext);
  if (!c) throw new Error('useStore must be used within StoreProvider');
  return c;
}
