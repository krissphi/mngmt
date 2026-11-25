import {
  Account,
  Category,
  Supplier,
  Product,
  InventoryMovement,
  Sale,
  Transaction,
  Budget,
  SavingsGoal,
  WishlistItem,
  Asset,
  Subscription,
  DebtRecord,
} from '@/types';
import { idbGet, idbSet, idbClear } from '@/lib/indexed-db';

export const LOCAL_STORAGE_KEY = 'arkaos_app_data_v1';
export const IDB_APP_KEY = 'arkaos_state_v1';

export interface AppStoredState {
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
  debts: DebtRecord[];
}

/**
 * Loads application state with IndexedDB primary engine and localStorage migration fallback.
 */
export async function loadStorageState(): Promise<Partial<AppStoredState> | null> {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Try reading from IndexedDB first (huge quota, handles large Base64 images)
    const idbState = await idbGet<Partial<AppStoredState>>(IDB_APP_KEY);
    if (idbState && Object.keys(idbState).length > 0) {
      return idbState;
    }

    // 2. Migration fallback: check legacy localStorage
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppStoredState>;
      await idbSet(IDB_APP_KEY, parsed);
      return parsed;
    }

    return null;
  } catch (err) {
    console.error('Failed to load storage state:', err);
    return null;
  }
}

/**
 * Synchronous fallback loader for immediate initial render before async completes.
 */
export function loadLocalStateSync(): Partial<AppStoredState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<AppStoredState>;
  } catch {
    return null;
  }
}

function createLightweightMirror(state: AppStoredState): AppStoredState {
  return {
    ...state,
    products: state.products.map((p) =>
      p.imageUrl && p.imageUrl.startsWith('data:') ? { ...p, imageUrl: undefined } : p
    ),
    assets: state.assets.map((a) =>
      a.imageUrl && a.imageUrl.startsWith('data:') ? { ...a, imageUrl: undefined } : a
    ),
  };
}

/**
 * Persists application state to IndexedDB and mirror-saves to localStorage when within quota.
 */
export async function saveStorageState(state: AppStoredState): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1. Mirror persistence synchronously first so it never races async IDB clear
  try {
    const lightweight = createLightweightMirror(state);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lightweight));
  } catch (err) {
    console.warn('LocalStorage quota reached, state safely stored in IndexedDB:', err);
  }

  // 2. Primary persistence: IndexedDB (asynchronous, multi-gigabyte quota)
  try {
    await idbSet(IDB_APP_KEY, state);
  } catch (err) {
    console.warn('IndexedDB save warning:', err);
  }
}

/**
 * Clears all application data from both storage tiers.
 */
export async function clearStorageState(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    await idbClear();
  } catch (err) {
    console.error('Failed to clear storage:', err);
  }
}
