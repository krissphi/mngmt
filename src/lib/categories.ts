import type { Category, CategoryType } from '@/types';

export function isMainCategory(cat: Category): boolean {
  return !cat.parentId;
}

export function getMainCategories(categories: Category[], allowedTypes?: CategoryType[]): Category[] {
  const mains = categories.filter((c) => !c.parentId);
  if (!allowedTypes || allowedTypes.length === 0) {
    return mains;
  }
  const typeSet = new Set<CategoryType>(['universal', ...allowedTypes]);
  return mains.filter((c) => typeSet.has(c.type));
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
