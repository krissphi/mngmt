'use client';

import React, { useMemo } from 'react';
import { Category, CategoryType } from '@/types';
import { getMainCategories, getSubCategories } from '@/lib/categories';

interface CategorySubSelectProps {
  categories: Category[];
  allowedTypes?: CategoryType[];
  categoryId: string;
  subCategoryId: string;
  onCategoryChange: (mainId: string) => void;
  onSubCategoryChange: (subId: string) => void;
  mainLabel?: string;
  subLabel?: string;
  required?: boolean;
  emptyMainLabel?: string;
  className?: string;
}

export function CategorySubSelect({
  categories,
  allowedTypes,
  categoryId,
  subCategoryId,
  onCategoryChange,
  onSubCategoryChange,
  mainLabel = 'Category',
  subLabel = 'Sub Category',
  required = false,
  emptyMainLabel = 'Select Category...',
  className = '',
}: CategorySubSelectProps) {
  const mainCategories = useMemo(
    () => getMainCategories(categories, allowedTypes),
    [categories, allowedTypes]
  );

  // If current categoryId is actually a legacy subcategory ID, resolve its parent smoothly
  const effectiveMainId = useMemo(() => {
    if (!categoryId) return '';
    const match = categories.find((c) => c.id === categoryId);
    if (match?.parentId) return match.parentId;
    return categoryId;
  }, [categories, categoryId]);

  const subCategories = useMemo(
    () => getSubCategories(categories, effectiveMainId),
    [categories, effectiveMainId]
  );

  // Also preserve legacy category if it wasn't in mainCategories filter
  const selectedOutsideFilter = useMemo(() => {
    if (!effectiveMainId) return null;
    if (mainCategories.some((c) => c.id === effectiveMainId)) return null;
    return categories.find((c) => c.id === effectiveMainId && !c.parentId) || null;
  }, [categories, mainCategories, effectiveMainId]);

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">{mainLabel}</label>
        <select
          className="w-full h-8.5 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none"
          value={effectiveMainId}
          required={required}
          onChange={(e) => {
            onCategoryChange(e.target.value);
            onSubCategoryChange('');
          }}
        >
          <option value="">{emptyMainLabel}</option>
          {selectedOutsideFilter && (
            <option value={selectedOutsideFilter.id}>{selectedOutsideFilter.name}</option>
          )}
          {mainCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">{subLabel}</label>
        <select
          className="w-full h-8.5 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          value={subCategoryId}
          disabled={!effectiveMainId || subCategories.length === 0}
          onChange={(e) => onSubCategoryChange(e.target.value)}
        >
          {!effectiveMainId ? (
            <option value="">Pick main category first</option>
          ) : subCategories.length === 0 ? (
            <option value="">No sub-categories</option>
          ) : (
            <>
              <option value="">General ({mainCategories.find((c) => c.id === effectiveMainId)?.name || 'Main'})</option>
              {subCategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </>
          )}
        </select>
      </div>
    </div>
  );
}
