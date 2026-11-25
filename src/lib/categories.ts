import type { Category, CategoryType, CategoryFlow } from '@/types';

export function isIncomeCategory(cat: Category): boolean {
  if (cat.flow === 'income') return true;
  if (cat.flow === 'expense') return false;
  return (
    cat.type === 'personal_income' ||
    cat.id === 'cat-inc-1' ||
    cat.parentId === 'cat-inc-1'
  );
}

export function isExpenseCategory(cat: Category): boolean {
  return !isIncomeCategory(cat);
}

export function isMainCategory(cat: Category): boolean {
  return !cat.parentId;
}

export interface GetMainCategoriesOptions {
  flow?: CategoryFlow | 'all';
  allowedTypes?: CategoryType[];
}

export function getMainCategories(
  categories: Category[],
  options?: GetMainCategoriesOptions | CategoryType[]
): Category[] {
  let mains = categories.filter((c) => !c.parentId);

  if (!options) return mains;

  let flow: 'income' | 'expense' | 'all' = 'all';
  let allowedTypes: CategoryType[] | undefined;

  if (Array.isArray(options)) {
    allowedTypes = options;
  } else {
    flow = options.flow || 'all';
    allowedTypes = options.allowedTypes;
  }

  if (flow === 'income') {
    mains = mains.filter(isIncomeCategory);
  } else if (flow === 'expense') {
    mains = mains.filter(isExpenseCategory);
  }

  if (allowedTypes && allowedTypes.length > 0) {
    const typeSet = new Set<CategoryType>(['universal', ...allowedTypes]);
    mains = mains.filter((c) => typeSet.has(c.type));
  }

  return mains;
}

export function getSubCategories(categories: Category[], parentId?: string): Category[] {
  if (!parentId) return [];
  return categories.filter((c) => c.parentId === parentId);
}

export interface ResolvedCategory {
  main?: Category;
  sub?: Category;
  mainId?: string;
  subId?: string;
  mainName: string;
  subName?: string;
  fullName: string;
  color?: string;
}

/**
 * Resolves main category and subcategory cleanly.
 * Also supports legacy records where `categoryId` directly pointed to a subcategory.
 */
export function resolveCategoryPair(
  categories: Category[],
  categoryId?: string,
  subCategoryId?: string,
  fallbackLabel = 'Uncategorized'
): ResolvedCategory {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const primary = categoryId ? byId.get(categoryId) : undefined;
  const explicitSub = subCategoryId ? byId.get(subCategoryId) : undefined;

  // Handle legacy case where categoryId itself is a child category
  if (primary?.parentId) {
    const parent = byId.get(primary.parentId);
    const main = parent || primary;
    const sub = explicitSub || (parent ? primary : undefined);
    return {
      main,
      sub,
      mainId: main.id,
      subId: sub?.id,
      mainName: main.name,
      subName: sub?.name,
      fullName: sub ? `${main.name} / ${sub.name}` : main.name,
      color: sub?.color || main.color,
    };
  }

  if (!primary && explicitSub) {
    const parent = explicitSub.parentId ? byId.get(explicitSub.parentId) : undefined;
    const main = parent;
    return {
      main,
      sub: explicitSub,
      mainId: main?.id,
      subId: explicitSub.id,
      mainName: main?.name || fallbackLabel,
      subName: explicitSub.name,
      fullName: main ? `${main.name} / ${explicitSub.name}` : explicitSub.name,
      color: explicitSub.color || main?.color,
    };
  }

  if (!primary) {
    return {
      main: undefined,
      sub: undefined,
      mainId: undefined,
      subId: undefined,
      mainName: fallbackLabel,
      subName: undefined,
      fullName: fallbackLabel,
      color: undefined,
    };
  }

  const validSub = explicitSub && (!explicitSub.parentId || explicitSub.parentId === primary.id) ? explicitSub : undefined;
  return {
    main: primary,
    sub: validSub,
    mainId: primary.id,
    subId: validSub?.id,
    mainName: primary.name,
    subName: validSub?.name,
    fullName: validSub ? `${primary.name} / ${validSub.name}` : primary.name,
    color: validSub?.color || primary.color,
  };
}
