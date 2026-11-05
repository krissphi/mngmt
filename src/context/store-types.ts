import {
  Account,
  Category,
  Product,
  Supplier,
  Sale,
  Transaction,
  Budget,
  SavingsGoal,
  WishlistItem,
  Asset,
  InventoryMovement,
  Subscription,
} from '@/types';

export interface StoreContextType {
  // State
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
  assets: Asset[];
  subscriptions: Subscription[];
  isLoaded: boolean;

  // Actions
  addTransaction: (trx: Omit<Transaction, 'id' | 'createdAt'>) => Transaction;
  addTransactionsBatch: (trxs: Omit<Transaction, 'id' | 'createdAt'>[]) => void;
  deleteTransaction: (id: string) => void;
  
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stockSold' | 'stockReserved'>) => Product;
  addProductsBatch: (products: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stockSold' | 'stockReserved'>[]) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, quantityChange: number, type: InventoryMovement['type'], notes: string) => void;

  recordSale: (sale: Omit<Sale, 'id' | 'createdAt' | 'orderNumber'> & { orderNumber?: string }) => Sale;
  updateSaleStatus: (saleId: string, newStatus: Sale['orderStatus']) => void;
  deleteSale: (saleId: string) => void;

  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Account;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  addBudget: (budget: Omit<Budget, 'id'>) => Budget;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => SavingsGoal;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;

  addWishlistItem: (item: Omit<WishlistItem, 'id' | 'createdAt'>) => WishlistItem;
  updateWishlistItem: (id: string, updates: Partial<WishlistItem>) => void;
  deleteWishlistItem: (id: string) => void;

  addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'sku'> & { sku?: string }, paymentAccountId?: string) => Asset;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;

  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => Supplier;
  deleteSupplier: (id: string) => void;

  addSubscription: (sub: Omit<Subscription, 'id' | 'createdAt'>) => Subscription;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  paySubscription: (id: string, paymentDetails?: { accountId?: string; date?: string; amount?: number }) => void;

  resetToDemoData: () => void;
  deleteAllData: () => void;
  restoreFullBackup: (backupData: unknown) => boolean;
}
