import type {
  Product,
  Sale,
  InventoryMovement,
  Account,
  Transaction,
  OrderStatus,
} from '@/types';
import { addMonths, addYears, addWeeks, addDays, format, parseISO, isValid } from 'date-fns';
import { calculateWeightedAverageCost } from '@/lib/calculations';

export function generateSecureId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

export function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.map((item, index) => {
    if (seen.has(item.id)) {
      const newId = `${item.id}-${index}-${Math.random().toString(36).substring(2, 6)}`;
      seen.add(newId);
      return { ...item, id: newId };
    }
    seen.add(item.id);
    return item;
  });
}

export function createInventoryMovement(
  productId: string,
  type: InventoryMovement['type'],
  quantity: number,
  notes: string,
  referenceId?: string,
  previousStock = 0,
  newStock = 0,
  timestamp?: string
): InventoryMovement {
  return {
    id: generateSecureId('mov'),
    productId,
    type,
    quantity,
    previousStock,
    newStock,
    referenceId,
    notes,
    createdAt: timestamp || format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
  };
}

export function isCancelledOrReturned(status: OrderStatus): boolean {
  return status === 'cancelled' || status === 'returned';
}

export function isReservedOrderStatus(status: OrderStatus): boolean {
  return status === 'pending' || status === 'confirmed' || status === 'processing';
}

export function isFulfilledOrderStatus(status: OrderStatus): boolean {
  return status === 'shipped' || status === 'completed';
}

type OrderStockBucket = 'reserved' | 'fulfilled' | 'inactive';

function getOrderStockBucket(status: OrderStatus): OrderStockBucket {
  if (isReservedOrderStatus(status)) return 'reserved';
  if (isFulfilledOrderStatus(status)) return 'fulfilled';
  return 'inactive';
}

function aggregateSaleItemQuantities(sale: Sale): Map<string, number> {
  const qtyByProduct = new Map<string, number>();
  for (const item of sale.items) {
    qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) || 0) + item.quantity);
  }
  return qtyByProduct;
}

export function applySaleToProducts(
  products: Product[],
  sale: Sale,
  nowIso: string,
  timestamp?: string
): { updatedProducts: Product[]; movements: InventoryMovement[] } {
  const movements: InventoryMovement[] = [];
  const bucket = getOrderStockBucket(sale.orderStatus);
  if (bucket === 'inactive') {
    return { updatedProducts: products, movements };
  }

  const qtyByProduct = aggregateSaleItemQuantities(sale);
  const ts = timestamp || nowIso.replace('T', ' ').substring(0, 19);

  const updatedProducts = products.map((prod) => {
    const qty = qtyByProduct.get(prod.id);
    if (!qty) return prod;

    if (bucket === 'reserved') {
      const nextReserved = (prod.stockReserved || 0) + qty;
      movements.push({
        id: generateSecureId('mov'),
        productId: prod.id,
        type: 'reserved',
        quantity: qty,
        previousStock: prod.stockOnHand,
        newStock: prod.stockOnHand,
        referenceId: sale.id,
        notes: `Reserved for ${sale.channel.toUpperCase()} #${sale.orderNumber} (${sale.orderStatus})`,
        createdAt: ts,
      });
      return {
        ...prod,
        stockReserved: nextReserved,
        updatedAt: nowIso,
      };
    }

    // Fulfilled immediately (shipped / completed)
    const prevStock = prod.stockOnHand;
    const newStock = Math.max(0, prevStock - qty);
    movements.push({
      id: generateSecureId('mov'),
      productId: prod.id,
      type: 'sale_out',
      quantity: -qty,
      previousStock: prevStock,
      newStock,
      referenceId: sale.id,
      notes: `Sale ${sale.channel.toUpperCase()} #${sale.orderNumber}`,
      createdAt: ts,
    });

    return {
      ...prod,
      stockOnHand: newStock,
      stockSold: (prod.stockSold || 0) + qty,
      updatedAt: nowIso,
    };
  });

  return { updatedProducts, movements };
}

export function applySaleStatusUpdate(
  sales: Sale[],
  products: Product[],
  targetSaleIds: string[],
  newStatus: OrderStatus,
  nowIso: string,
  timestamp?: string
): { updatedSales: Sale[]; updatedProducts: Product[]; movements: InventoryMovement[]; cancelledPaidSaleIds: string[] } {
  const idSet = new Set(targetSaleIds);
  const movements: InventoryMovement[] = [];
  const cancelledPaidSaleIds: string[] = [];
  const ts = timestamp || nowIso.replace('T', ' ').substring(0, 19);

  interface StockDelta {
    deltaOnHand: number;
    deltaReserved: number;
    deltaSold: number;
    movType: InventoryMovement['type'];
    movQty: number;
    notes: string;
    saleId: string;
  }

  const changesByProduct = new Map<string, StockDelta[]>();

  const pushDelta = (productId: string, delta: StockDelta) => {
    const arr = changesByProduct.get(productId) || [];
    arr.push(delta);
    changesByProduct.set(productId, arr);
  };

  const updatedSales = sales.map((sale) => {
    if (!idSet.has(sale.id)) return sale;

    const prevStatus = sale.orderStatus;
    if (prevStatus === newStatus) return sale;

    const prevBucket = getOrderStockBucket(prevStatus);
    const newBucket = getOrderStockBucket(newStatus);
    const qtyByProduct = aggregateSaleItemQuantities(sale);

    if (prevBucket !== newBucket) {
      qtyByProduct.forEach((qty, productId) => {
        if (prevBucket === 'reserved' && newBucket === 'fulfilled') {
          pushDelta(productId, {
            deltaOnHand: -qty,
            deltaReserved: -qty,
            deltaSold: qty,
            movType: 'sale_out',
            movQty: -qty,
            notes: `Order #${sale.orderNumber} ${newStatus} - Stock fulfilled`,
            saleId: sale.id,
          });
        } else if (prevBucket === 'fulfilled' && newBucket === 'reserved') {
          pushDelta(productId, {
            deltaOnHand: qty,
            deltaReserved: qty,
            deltaSold: -qty,
            movType: 'reserved',
            movQty: qty,
            notes: `Order #${sale.orderNumber} reverted to ${newStatus} - Stock reserved`,
            saleId: sale.id,
          });
        } else if (prevBucket === 'reserved' && newBucket === 'inactive') {
          pushDelta(productId, {
            deltaOnHand: 0,
            deltaReserved: -qty,
            deltaSold: 0,
            movType: 'unreserved',
            movQty: qty,
            notes: `Order #${sale.orderNumber} ${newStatus} - Reservation released`,
            saleId: sale.id,
          });
        } else if (prevBucket === 'fulfilled' && newBucket === 'inactive') {
          pushDelta(productId, {
            deltaOnHand: qty,
            deltaReserved: 0,
            deltaSold: -qty,
            movType: 'return_in',
            movQty: qty,
            notes: `Order #${sale.orderNumber} ${newStatus === 'cancelled' ? 'Cancelled' : 'Returned'} - Stock restored`,
            saleId: sale.id,
          });
        } else if (prevBucket === 'inactive' && newBucket === 'reserved') {
          pushDelta(productId, {
            deltaOnHand: 0,
            deltaReserved: qty,
            deltaSold: 0,
            movType: 'reserved',
            movQty: qty,
            notes: `Order #${sale.orderNumber} reactivated (${newStatus}) - Stock reserved`,
            saleId: sale.id,
          });
        } else if (prevBucket === 'inactive' && newBucket === 'fulfilled') {
          pushDelta(productId, {
            deltaOnHand: -qty,
            deltaReserved: 0,
            deltaSold: qty,
            movType: 'sale_out',
            movQty: -qty,
            notes: `Order #${sale.orderNumber} reactivated (${newStatus}) - Stock deducted`,
            saleId: sale.id,
          });
        }
      });
    }

    let nextPaymentStatus = sale.paymentStatus;
    if (prevBucket !== 'inactive' && newBucket === 'inactive' && sale.paymentStatus === 'paid') {
      cancelledPaidSaleIds.push(sale.id);
      nextPaymentStatus = 'unpaid';
    }

    return { ...sale, orderStatus: newStatus, paymentStatus: nextPaymentStatus };
  });

  const updatedProducts = products.map((prod) => {
    const deltas = changesByProduct.get(prod.id);
    if (!deltas || deltas.length === 0) return prod;

    let currentOnHand = prod.stockOnHand;
    let currentReserved = prod.stockReserved || 0;
    let currentSold = prod.stockSold || 0;

    for (const d of deltas) {
      const prev = currentOnHand;
      currentOnHand = Math.max(0, currentOnHand + d.deltaOnHand);
      currentReserved = Math.max(0, currentReserved + d.deltaReserved);
      currentSold = Math.max(0, currentSold + d.deltaSold);

      movements.push({
        id: generateSecureId('mov'),
        productId: prod.id,
        type: d.movType,
        quantity: d.movQty,
        previousStock: prev,
        newStock: currentOnHand,
        referenceId: d.saleId,
        notes: d.notes,
        createdAt: ts,
      });
    }

    return {
      ...prod,
      stockOnHand: currentOnHand,
      stockReserved: currentReserved,
      stockSold: currentSold,
      updatedAt: nowIso,
    };
  });

  return { updatedSales, updatedProducts, movements, cancelledPaidSaleIds };
}

export function applySaleStatusUpdateSingle(
  sales: Sale[],
  products: Product[],
  saleId: string,
  newStatus: OrderStatus,
  nowIso: string,
  timestamp?: string
): { updatedSales: Sale[]; updatedProducts: Product[]; movements: InventoryMovement[]; cancelledPaidSaleIds: string[] } {
  return applySaleStatusUpdate(sales, products, [saleId], newStatus, nowIso, timestamp);
}

export function applyTransactionBalance(
  accounts: Account[],
  trx: Pick<Transaction, 'type' | 'amount' | 'accountId' | 'toAccountId'>,
  direction: 1 | -1,
  nowIso: string
): Account[] {
  return accounts.map((acc) => {
    let delta = 0;
    if (acc.id === trx.accountId) {
      delta += direction * (trx.type === 'income' ? trx.amount : -trx.amount);
    }
    if (trx.type === 'transfer' && trx.toAccountId && acc.id === trx.toAccountId) {
      delta += direction * trx.amount;
    }
    if (delta === 0) return acc;
    return { ...acc, balance: acc.balance + delta, updatedAt: nowIso };
  });
}

export function applyDeleteTransaction(
  transactions: Transaction[],
  accounts: Account[],
  id: string,
  nowIso: string = new Date().toISOString()
): { updatedTransactions: Transaction[]; updatedAccounts: Account[]; deletedTransaction?: Transaction } {
  const toDelete = transactions.find((t) => t.id === id);
  if (!toDelete) return { updatedTransactions: transactions, updatedAccounts: accounts };

  const updatedAccounts = applyTransactionBalance(accounts, toDelete, -1, nowIso);
  const updatedTransactions = transactions.filter((t) => t.id !== id);
  return { updatedTransactions, updatedAccounts, deletedTransaction: toDelete };
}

export function applyUpdateTransaction(
  transactions: Transaction[],
  accounts: Account[],
  id: string,
  updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>,
  nowIso: string = new Date().toISOString()
): { updatedTransactions: Transaction[]; updatedAccounts: Account[] } {
  const existing = transactions.find((t) => t.id === id);
  if (!existing) return { updatedTransactions: transactions, updatedAccounts: accounts };

  const updatedTrx: Transaction = { ...existing, ...updates };
  // Revert old balance effect, then apply updated balance effect
  const revertedAccounts = applyTransactionBalance(accounts, existing, -1, nowIso);
  const updatedAccounts = applyTransactionBalance(revertedAccounts, updatedTrx, 1, nowIso);

  const updatedTransactions = transactions.map((t) => (t.id === id ? updatedTrx : t));
  return { updatedTransactions, updatedAccounts };
}

export function applyDeleteSale(
  sales: Sale[],
  products: Product[],
  transactions: Transaction[],
  accounts: Account[],
  saleId: string,
  nowIso: string,
  timestamp?: string
): {
  updatedSales: Sale[];
  updatedProducts: Product[];
  updatedTransactions: Transaction[];
  updatedAccounts: Account[];
  movements: InventoryMovement[];
} {
  const targetSale = sales.find((s) => s.id === saleId);
  if (!targetSale) {
    return {
      updatedSales: sales,
      updatedProducts: products,
      updatedTransactions: transactions,
      updatedAccounts: accounts,
      movements: [],
    };
  }

  const ts = timestamp || nowIso.replace('T', ' ').substring(0, 19);
  const movements: InventoryMovement[] = [];
  const bucket = getOrderStockBucket(targetSale.orderStatus);
  const qtyByProduct = aggregateSaleItemQuantities(targetSale);

  const updatedProducts =
    bucket === 'inactive'
      ? products
      : products.map((prod) => {
          const qty = qtyByProduct.get(prod.id);
          if (!qty) return prod;

          if (bucket === 'reserved') {
            const nextReserved = Math.max(0, (prod.stockReserved || 0) - qty);
            movements.push({
              id: generateSecureId('mov'),
              productId: prod.id,
              type: 'unreserved',
              quantity: qty,
              previousStock: prod.stockOnHand,
              newStock: prod.stockOnHand,
              referenceId: targetSale.id,
              notes: `Unreserved deleted order #${targetSale.orderNumber}`,
              createdAt: ts,
            });
            return { ...prod, stockReserved: nextReserved, updatedAt: nowIso };
          }

          const newStock = prod.stockOnHand + qty;
          const newSold = Math.max(0, (prod.stockSold || 0) - qty);
          movements.push({
            id: generateSecureId('mov'),
            productId: prod.id,
            type: 'return_in',
            quantity: qty,
            previousStock: prod.stockOnHand,
            newStock,
            referenceId: targetSale.id,
            notes: `Rollback deleted sale #${targetSale.orderNumber}`,
            createdAt: ts,
          });
          return { ...prod, stockOnHand: newStock, stockSold: newSold, updatedAt: nowIso };
        });

  // Revert any linked business_sale transactions
  const relatedIds = new Set(
    transactions
      .filter((t) => t.referenceId === saleId && t.sourceModule === 'business_sale')
      .map((t) => t.id)
  );
  let nextTransactions = transactions;
  let nextAccounts = accounts;
  relatedIds.forEach((trxId) => {
    const res = applyDeleteTransaction(nextTransactions, nextAccounts, trxId, nowIso);
    nextTransactions = res.updatedTransactions;
    nextAccounts = res.updatedAccounts;
  });

  return {
    updatedSales: sales.filter((s) => s.id !== saleId),
    updatedProducts,
    updatedTransactions: nextTransactions,
    updatedAccounts: nextAccounts,
    movements,
  };
}

export function applyStockPurchase(
  products: Product[],
  accounts: Account[],
  transactions: Transaction[],
  params: {
    productId: string;
    quantity: number;
    unitCost: number;
    supplierId?: string;
    paymentAccountId?: string;
    date: string;
    notes?: string;
    nowIso: string;
    timestamp?: string;
  }
): {
  updatedProducts: Product[];
  updatedAccounts: Account[];
  updatedTransactions: Transaction[];
  movement?: InventoryMovement;
} {
  const target = products.find((p) => p.id === params.productId);
  if (!target || params.quantity <= 0) {
    return { updatedProducts: products, updatedAccounts: accounts, updatedTransactions: transactions };
  }

  const ts = params.timestamp || params.nowIso.replace('T', ' ').substring(0, 19);
  const prevStock = target.stockOnHand;
  const newStock = prevStock + params.quantity;
  const newAvgCost = calculateWeightedAverageCost(prevStock, target.purchaseCost, params.quantity, params.unitCost);
  const totalCost = params.quantity * params.unitCost;

  const updatedProducts = products.map((p) =>
    p.id === params.productId
      ? {
          ...p,
          stockOnHand: newStock,
          purchaseCost: newAvgCost,
          supplierId: params.supplierId || p.supplierId,
          updatedAt: params.nowIso,
        }
      : p
  );

  const movement = createInventoryMovement(
    target.id,
    'purchase_in',
    params.quantity,
    params.notes?.trim() || `Restock +${params.quantity} pcs @ ${params.unitCost}`,
    undefined,
    prevStock,
    newStock,
    ts
  );

  let updatedTransactions = transactions;
  let updatedAccounts = accounts;
  if (params.paymentAccountId && totalCost > 0) {
    const trx: Transaction = {
      id: generateSecureId('trx'),
      date: params.date,
      scope: 'business',
      type: 'expense',
      amount: totalCost,
      accountId: params.paymentAccountId,
      categoryId: 'cat-biz-1',
      sourceModule: 'business_purchase',
      referenceId: target.id,
      description: `Restock ${target.name} (${params.quantity}x)`,
      notes: params.notes?.trim() || undefined,
      createdAt: params.nowIso,
    };
    updatedTransactions = [trx, ...transactions];
    updatedAccounts = applyTransactionBalance(accounts, trx, 1, params.nowIso);
  }

  return {
    updatedProducts,
    updatedAccounts,
    updatedTransactions,
    movement,
  };
}

export function cleanCategoryName(name: string): string {
  if (!name) return 'Umum';
  return name.trim();
}

export function advanceNextBillingDate(dateStr: string, cycle: 'monthly' | 'yearly' | 'weekly' | '28_days'): string {
  try {
    const baseDate = parseISO(dateStr);
    if (!isValid(baseDate)) {
      return format(addMonths(new Date(), 1), 'yyyy-MM-dd');
    }
    let nextDate: Date;
    switch (cycle) {
      case 'yearly':
        nextDate = addYears(baseDate, 1);
        break;
      case 'weekly':
        nextDate = addWeeks(baseDate, 1);
        break;
      case '28_days':
        nextDate = addDays(baseDate, 28);
        break;
      case 'monthly':
      default:
        nextDate = addMonths(baseDate, 1);
        break;
    }
    return format(nextDate, 'yyyy-MM-dd');
  } catch {
    return format(addMonths(new Date(), 1), 'yyyy-MM-dd');
  }
}
