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
  DebtRecord,
} from '@/types';

export interface StoreContextType {
  // State
  accounts: Account[];
  pockets: Account[]; // Alias ramah pengguna untuk accounts
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
  debts: DebtRecord[];
  isLoaded: boolean;

  // Transaction Actions
  addTransaction: (trx: Omit<Transaction, 'id' | 'createdAt'>) => Transaction;
  addTransactionsBatch: (trxs: Omit<Transaction, 'id' | 'createdAt'>[]) => void;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => void;
  deleteTransaction: (id: string) => void;

  // Product & Stock Actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stockSold' | 'stockReserved'>) => Product;
  addProductsBatch: (products: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stockSold' | 'stockReserved'>[]) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  archiveProduct: (id: string) => void;
  unarchiveProduct: (id: string) => void;
  archiveOutOfStockProducts: () => void;
  adjustStock: (productId: string, quantityChange: number, type: InventoryMovement['type'], notes: string) => void;
  recordStockPurchase: (params: {
    productId: string;
    quantity: number;
    unitCost: number;
    supplierId?: string;
    paymentAccountId?: string;
    date?: string;
    notes?: string;
  }) => void;

  // Sale Actions
  recordSale: (sale: Omit<Sale, 'id' | 'createdAt' | 'orderNumber'> & { orderNumber?: string }) => Sale;
  updateSaleStatus: (saleId: string, newStatus: Sale['orderStatus']) => void;
  settleSalePayment: (saleId: string, accountId: string, date?: string) => void;
  deleteSale: (saleId: string) => void;

  // Account / Pocket Actions
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Account;
  updateAccount: (id: string, updates: Partial<Account>, options?: { recordAdjustment?: boolean }) => void;
  deleteAccount: (id: string) => void;
  updateCashBreakdown: (accountId: string, breakdown: Record<number, number>, options?: { recordAdjustment?: boolean }) => void;

  // Category Actions
  addCategory: (category: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Budget Actions
  addBudget: (budget: Omit<Budget, 'id'>) => Budget;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  // Savings Goal Actions
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => SavingsGoal;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  depositToSavingsGoal: (goalId: string, amount: number, accountId?: string, date?: string) => void;
  deleteSavingsGoal: (id: string) => void;

  // Wishlist Actions
  addWishlistItem: (item: Omit<WishlistItem, 'id' | 'createdAt'>) => WishlistItem;
  updateWishlistItem: (id: string, updates: Partial<WishlistItem>) => void;
  deleteWishlistItem: (id: string) => void;

  // Asset / Collection Actions
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'sku'> & { sku?: string }, paymentAccountId?: string) => Asset;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  transferCollectionToSeller: (assetId: string, sellingPrice: number, sku?: string) => void;
  transferProductToCollection: (productId: string, condition?: Asset['condition']) => void;

  // Supplier Actions
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Subscription Actions
  addSubscription: (sub: Omit<Subscription, 'id' | 'createdAt'>) => Subscription;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  paySubscription: (id: string, paymentDetails?: { accountId?: string; date?: string; amount?: number }) => void;

  // Debt / Receivable Actions
  addDebt: (debt: Omit<DebtRecord, 'id' | 'createdAt' | 'updatedAt'>) => DebtRecord;
  updateDebt: (id: string, updates: Partial<DebtRecord>) => void;
  recordDebtPayment: (debtId: string, amount: number, accountId?: string, date?: string) => void;
  deleteDebt: (id: string) => void;

  // System Actions
  resetToDemoData: () => void;
  deleteAllData: () => void;
  restoreFullBackup: (backupData: unknown) => boolean;
  restoreFullBackupDetailed: (backupData: unknown) => { ok: boolean; error?: string };
}
