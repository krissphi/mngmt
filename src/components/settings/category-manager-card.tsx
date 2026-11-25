'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { Category, CategoryType } from '@/types';
import { getMainCategories, getSubCategories } from '@/lib/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { FolderTree, Plus, Trash2, Pencil, Check, X } from 'lucide-react';

const SCOPE_LABELS: Record<CategoryType, string> = {
  universal: 'Universal (All Modules)',
  personal_expense: 'Personal Expense',
  personal_income: 'Personal Income',
  business_expense: 'Business Expense',
  product: 'Product & Collection',
};

export function CategoryManagerCard() {
  const { categories, addCategory, updateCategory, deleteCategory } = useStore();

  const [newMainName, setNewMainName] = useState('');
  const [newMainType, setNewMainType] = useState<CategoryType>('universal');
  const [newMainColor, setNewMainColor] = useState('#2563EB');

  const [addingSubForId, setAddingSubForId] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const [deletingCat, setDeletingCat] = useState<Category | null>(null);

  const mainCategories = useMemo(() => getMainCategories(categories), [categories]);

  const handleAddMain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMainName.trim()) return;
    addCategory({
      name: newMainName.trim(),
      type: newMainType,
      color: newMainColor,
    });
    setNewMainName('');
  };

  const handleAddSub = (parent: Category) => {
    if (!newSubName.trim()) return;
    addCategory({
      name: newSubName.trim(),
      type: parent.type,
      parentId: parent.id,
      color: parent.color,
    });
    setNewSubName('');
    setAddingSubForId(null);
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const commitEdit = (id: string) => {
    if (editName.trim()) {
      updateCategory(id, { name: editName.trim() });
    }
    setEditingId(null);
  };

  return (
    <Card className="border-border/60 bg-card">
      <CardHeader className="py-4 px-5 border-b border-border/60">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FolderTree className="size-4 text-primary" />
          <span>Categories &amp; Sub-Categories</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-5">
        <p className="text-xs text-muted-foreground">
          Keep main categories concise and organize specific items under sub-categories. Sub-categories automatically roll up into their main category on Budgets and Charts.
        </p>

        {/* Add Main Category Form */}
        <form onSubmit={handleAddMain} className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto_auto] gap-2 items-end p-3 rounded-xl bg-muted/25 border border-border/50">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">New Main Category</label>
            <Input
              placeholder="e.g. Health, Education, Apparel"
              value={newMainName}
              onChange={(e) => setNewMainName(e.target.value)}
              className="h-8 text-xs bg-card"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">Scope</label>
            <select
              value={newMainType}
              onChange={(e) => setNewMainType(e.target.value as CategoryType)}
              className="w-full h-8 rounded-md border border-input bg-card px-2 text-xs text-foreground"
            >
              {Object.entries(SCOPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">Color</label>
            <input
              type="color"
              value={newMainColor}
              onChange={(e) => setNewMainColor(e.target.value)}
              className="h-8 w-10 rounded border border-input bg-card cursor-pointer p-0.5"
              title="Pick color"
            />
          </div>
          <Button type="submit" size="sm" className="h-8 text-xs gap-1 bg-primary text-primary-foreground">
            <Plus className="size-3.5" />
            <span>Add Main</span>
          </Button>
        </form>

        {/* Main Categories & Nested Sub-Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mainCategories.map((main) => {
            const subs = getSubCategories(categories, main.id);
            const isEditingMain = editingId === main.id;

            return (
              <div
                key={main.id}
                className="rounded-xl border border-border/60 bg-card/60 p-3.5 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className="size-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: main.color || '#2563EB' }}
                    />
                    {isEditingMain ? (
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-7 text-xs"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitEdit(main.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => commitEdit(main.id)}
                          className="p-1 text-emerald-500 hover:bg-muted rounded"
                        >
                          <Check className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1 text-muted-foreground hover:bg-muted rounded"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate">{main.name}</div>
                        <div className="text-[10px] text-muted-foreground">{SCOPE_LABELS[main.type] || main.type}</div>
                      </div>
                    )}
                  </div>

                  {!isEditingMain && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAddingSubForId(addingSubForId === main.id ? null : main.id);
                          setNewSubName('');
                        }}
                        className="h-6.5 px-2 text-[11px] text-primary gap-1"
                      >
                        <Plus className="size-3" />
                        <span>Sub</span>
                      </Button>
                      <button
                        type="button"
                        onClick={() => startEdit(main)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded"
                        title="Rename category"
                      >
                        <Pencil className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCat(main)}
                        className="p-1 text-muted-foreground hover:text-rose-500 rounded"
                        title="Delete category"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline Add Sub-Category */}
                {addingSubForId === main.id && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <Input
                      placeholder={`New sub-category under ${main.name}...`}
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      className="h-7 text-xs"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSub(main);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAddSub(main)}
                      className="h-7 px-2.5 text-xs"
                    >
                      Add
                    </Button>
                  </div>
                )}

                {/* Sub-categories Chips */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {subs.length === 0 ? (
                    <span className="text-[11px] italic text-muted-foreground/60">No sub-categories</span>
                  ) : (
                    subs.map((sub) => (
                      <Badge
                        key={sub.id}
                        variant="secondary"
                        className="text-[11px] font-normal py-0.5 px-2 gap-1.5 flex items-center"
                      >
                        {editingId === sub.id ? (
                          <span className="inline-flex items-center gap-1">
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-24 bg-background border border-input rounded px-1 text-[11px] text-foreground"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitEdit(sub.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                            <button type="button" onClick={() => commitEdit(sub.id)} className="text-emerald-500">
                              <Check className="size-3" />
                            </button>
                          </span>
                        ) : (
                          <>
                            <span>{sub.name}</span>
                            <button
                              type="button"
                              onClick={() => startEdit(sub)}
                              className="text-muted-foreground/70 hover:text-foreground"
                              title="Rename sub-category"
                            >
                              <Pencil className="size-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingCat(sub)}
                              className="text-muted-foreground/70 hover:text-rose-500"
                              title="Delete sub-category"
                            >
                              <X className="size-3" />
                            </button>
                          </>
                        )}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      <ConfirmDialog
        open={!!deletingCat}
        onOpenChange={(open) => !open && setDeletingCat(null)}
        title={deletingCat?.parentId ? 'Delete Sub-Category?' : 'Delete Main Category?'}
        description={
          deletingCat?.parentId
            ? `Delete sub-category "${deletingCat?.name}"? Existing transactions will fall back to their main category.`
            : `Delete "${deletingCat?.name}" and all of its sub-categories? Existing transactions will show as Uncategorized.`
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          if (deletingCat) {
            deleteCategory(deletingCat.id);
            setDeletingCat(null);
          }
        }}
      />
    </Card>
  );
}
