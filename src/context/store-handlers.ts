import {
  Product,
  Sale,
  InventoryMovement,
  Account,
  Transaction,
} from '@/types';
import { addMonths, addYears, addWeeks, addDays, format, parseISO, isValid } from 'date-fns';

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
  referenceId?: string
): InventoryMovement {
  const salt = Math.random().toString(36).substring(2, 6);
  return {
    id: `mov-${Date.now()}-${salt}-${productId}`,
    productId,
    type,
    quantity,
    previousStock: 0,
    newStock: 0,
    referenceId,
    notes,
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };
}

export function applySaleToProducts(
  products: Product[],
  sale: Sale,
  now: string
): { updatedProducts: Product[]; movements: InventoryMovement[] } {
  const movements: InventoryMovement[] = [];

  const updatedProducts = products.map((prod) => {
    const soldItem = sale.items.find((i) => i.productId === prod.id);
    if (!soldItem) return prod;

    const qty = soldItem.quantity;
    const prevStock = prod.stockOnHand;
    const newStock = Math.max(0, prevStock - qty);

    movements.push({
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${prod.id}`,
      productId: prod.id,
      type: 'sale_out',
      quantity: -qty,
      previousStock: prevStock,
      newStock,
      referenceId: sale.id,
      notes: `Sale ${sale.channel.toUpperCase()} #${sale.orderNumber}`,
      createdAt: now.replace('T', ' ').substring(0, 19),
    });

    return {
      ...prod,
      stockOnHand: newStock,
      stockSold: (prod.stockSold || 0) + qty,
      updatedAt: now,
    };
  });

  return { updatedProducts, movements };
}

export function isCancelledOrReturned(status: Sale['orderStatus']): boolean {
  return status === 'cancelled' || status === 'returned';
}

export function applySaleStatusUpdate(
  sales: Sale[],
  products: Product[],
  targetSaleIds: string[],
  newStatus: Sale['orderStatus'],
  now: string
): { updatedSales: Sale[]; updatedProducts: Product[]; movements: InventoryMovement[] } {
  const idSet = new Set(targetSaleIds);
  const movements: InventoryMovement[] = [];

  const stockChanges: Record<string, { deltaStock: number; deltaSold: number; notes: string; saleId: string; type: InventoryMovement['type'] }[]> = {};

  const updatedSales = sales.map((sale) => {
    if (!idSet.has(sale.id)) return sale;

    const prevStatus = sale.orderStatus;
    const prevInactive = isCancelledOrReturned(prevStatus);
    const newInactive = isCancelledOrReturned(newStatus);

    // Case 1: Active -> Inactive (Order Cancelled/Returned) -> Rollback stock into inventory!
    if (!prevInactive && newInactive) {
      sale.items.forEach((item) => {
        if (!stockChanges[item.productId]) stockChanges[item.productId] = [];
        stockChanges[item.productId].push({
          deltaStock: item.quantity,
          deltaSold: -item.quantity,
          notes: `Order #${sale.orderNumber} ${newStatus === 'cancelled' ? 'Cancelled' : 'Returned'} - Stock restored`,
          saleId: sale.id,
          type: 'return_in',
        });
      });
    }
    // Case 2: Inactive -> Active (Order Reactivated) -> Re-deduct stock!
    else if (prevInactive && !newInactive) {
      sale.items.forEach((item) => {
        if (!stockChanges[item.productId]) stockChanges[item.productId] = [];
        stockChanges[item.productId].push({
          deltaStock: -item.quantity,
          deltaSold: item.quantity,
          notes: `Order #${sale.orderNumber} Reactivated (${newStatus}) - Stock deducted`,
          saleId: sale.id,
          type: 'sale_out',
        });
      });
    }

    return { ...sale, orderStatus: newStatus };
  });

  const updatedProducts = products.map((prod) => {
    const changes = stockChanges[prod.id];
    if (!changes || changes.length === 0) return prod;

    let currentStock = prod.stockOnHand;
    let currentSold = prod.stockSold || 0;

    changes.forEach((ch) => {
      const prev = currentStock;
      const next = Math.max(0, currentStock + ch.deltaStock);
      currentSold = Math.max(0, currentSold + ch.deltaSold);

      movements.push({
        id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${prod.id}`,
        productId: prod.id,
        type: ch.type,
        quantity: ch.deltaStock,
        previousStock: prev,
        newStock: next,
        referenceId: ch.saleId,
        notes: ch.notes,
        createdAt: now.replace('T', ' ').substring(0, 19),
      });

      currentStock = next;
    });

    return {
      ...prod,
      stockOnHand: currentStock,
      stockSold: currentSold,
      updatedAt: now,
    };
  });

  return { updatedSales, updatedProducts, movements };
}

export const CATEGORY_MIGRATION_MAP: Record<string, string> = {
  'Action Figures': 'Toys',
  'Model Kits & Gunpla': 'Toys',
  'Preloved Electronics': 'Electronics',
  'Aksesoris & Supplies': 'Equipment',
  'Makanan & Minuman': 'Food',
  'Makanan': 'Food',
  'Mainan': 'Toys',
  'Elektronik': 'Electronics',
  'Peralatan': 'Equipment',
  'Internet & Seluler': 'Internet',
  'Listrik & Utilitas': 'Utilities',
  'Listrik': 'Utilities',
  'Transportasi & Bensin': 'Transport',
  'Transportasi': 'Transport',
  'Hiburan & Hobi': 'Entertainment',
  'Hiburan': 'Entertainment',
  'Kebutuhan Rumah Tangga': 'Housing',
  'Rumah': 'Housing',
  'Packing & Bubble Wrap': 'Packaging',
  'Pengemasan': 'Packaging',
  'Biaya Iklan (Ads)': 'Advertising',
  'Iklan': 'Advertising',
  'Ongkir & Logistik': 'Logistics',
  'Logistik': 'Logistics',
  'Alat & Perlengkapan Toko': 'Operations',
  'Operasional': 'Operations',
  'Gaji Pokok': 'Salary',
  'Gaji': 'Salary',
  'Freelance & Side Project': 'Freelance',
  'Komisi Afiliasi': 'Commission',
  'Komisi': 'Commission',
  'Dividen & Investasi': 'Investments',
  'Investasi': 'Investments',
  'Personal Collection': 'Collectibles',
  'Personal Electronics': 'Electronics',
  'Vintage Toys': 'Toys',
  'Property & Furniture': 'Property',
  'Properti': 'Property',
};

export function cleanCategoryName(name: string): string {
  if (CATEGORY_MIGRATION_MAP[name]) return CATEGORY_MIGRATION_MAP[name];
  if (name.includes('&') || name.includes('/')) {
    const firstWord = name.split(/[&/]/)[0].trim();
    return firstWord || name;
  }
  return name;
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

export function applyDeleteTransaction(
  transactions: Transaction[],
  accounts: Account[],
  id: string
): { updatedTransactions: Transaction[]; updatedAccounts: Account[] } {
  const toDelete = transactions.find((t) => t.id === id);
  if (!toDelete) return { updatedTransactions: transactions, updatedAccounts: accounts };

  const rev = toDelete.type === 'income' ? -toDelete.amount : toDelete.amount;
  const updatedAccounts = accounts.map((acc) => {
    let balance = acc.balance;
    let modified = false;
    if (acc.id === toDelete.accountId) {
      balance += rev;
      modified = true;
    }
    if (toDelete.type === 'transfer' && toDelete.toAccountId && acc.id === toDelete.toAccountId) {
      balance -= toDelete.amount;
      modified = true;
    }
    return modified ? { ...acc, balance, updatedAt: new Date().toISOString() } : acc;
  });

  const updatedTransactions = transactions.filter((t) => t.id !== id);
  return { updatedTransactions, updatedAccounts };
}

export function applySaleStatusUpdateSingle(
  sales: Sale[],
  products: Product[],
  saleId: string,
  newStatus: Sale['orderStatus'],
  now: string
): { updatedSales: Sale[]; updatedProducts: Product[]; movements: InventoryMovement[] } {
  return applySaleStatusUpdate(sales, products, [saleId], newStatus, now);
}
