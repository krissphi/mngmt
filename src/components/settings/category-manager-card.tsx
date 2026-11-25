'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { Category, CategoryFlow } from '@/types';
import { getMainCategories, getSubCategories, isIncomeCategory } from '@/lib/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { FolderTree, Plus, Trash2, Pencil, Check, X, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export function CategoryManagerCard() {
  const { categories, addCategory, updateCategory, deleteCategory } = useStore();

  const [activeTab, setActiveTab] = useState<CategoryFlow>('expense');
  const [newMainName, setNewMainName] = useState('');
  const [newMainFlow, setNewMainFlow] = useState<CategoryFlow>('expense');
  const [newMainColor, setNewMainColor] = useState('#2563EB');

  const [addingSubForId, setAddingSubForId] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const [deletingCat, setDeletingCat] = useState<Category | null>(null);

  const outcomeMains = useMemo(
    () => getMainCategories(categories, { flow: 'expense' }),
    [categories]
  );
  const incomeMains = useMemo(
    () => getMainCategories(categories, { flow: 'income' }),
    [categories]
  );

  const displayedMains = activeTab === 'income' ? incomeMains : outcomeMains;

  const handleTabChange = (tab: CategoryFlow) => {
    setActiveTab(tab);
    setNewMainFlow(tab);
    setAddingSubForId(null);
  };

  const handleAddMain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMainName.trim()) return;

    const isInc = newMainFlow === 'income';
    addCategory({
      name: newMainName.trim(),
      type: isInc ? 'personal_income' : 'personal_expense',
      flow: newMainFlow,
      color: newMainColor,
    });
    setNewMainName('');
  };

  const handleAddSub = (parent: Category) => {
    if (!newSubName.trim()) return;
    const isInc = isIncomeCategory(parent);
    addCategory({
      name: newSubName.trim(),
      type: parent.type,
      flow: isInc ? 'income' : 'expense',
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FolderTree className="size-4 text-primary" />
            <span>Category Manager</span>
          </CardTitle>

          {/* Flow Segment Tabs */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/40 border border-border/50 text-xs">
            <button
              type="button"
              onClick={() => handleTabChange('expense')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === 'expense'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowDownRight className="size-3.5 text-rose-500" />
              <span>Outcome ({outcomeMains.length})</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('income')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === 'income'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowUpRight className="size-3.5 text-emerald-500" />
              <span>Income ({incomeMains.length})</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        <p className="text-xs text-muted-foreground">
          {activeTab === 'expense'
            ? 'Outcome categories are used for expenses, shopping, products, collections, and budgets.'
            : 'Income categories are used for salary, bonuses, investments, sales, and freelance earnings.'}
        </p>

        {/* Add Main Category Form */}
        <form
          onSubmit={handleAddMain}
          className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto_auto] gap-2 items-end p-3 rounded-xl bg-muted/25 border border-border/50"
        >
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              New {activeTab === 'income' ? 'Income' : 'Outcome'} Category
            </label>
            <Input
              placeholder={
                activeTab === 'income'
                  ? 'e.g. Consulting, Royalties, Grants'
                  : 'e.g. Health, Education, Subscriptions'
              }
              value={newMainName}
              onChange={(e) => setNewMainName(e.target.value)}
              className="h-8 text-xs bg-card"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">Flow</label>
            <select
              value={newMainFlow}
              onChange={(e) => setNewMainFlow(e.target.value as CategoryFlow)}
              className="w-full h-8 rounded-md border border-input bg-card px-2 text-xs text-foreground"
            >
              <option value="expense">Outcome (Expense)</option>
              <option value="income">Income</option>
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
        {displayedMains.length === 0 ? (
          <div className="py-8 text-center rounded-xl border border-dashed border-border/60 text-xs text-muted-foreground">
            No {activeTab} categories found. Add one above.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayedMains.map((main) => {
              const subs = getSubCategories(categories, main.id);
              const isEditingMain = editingId === main.id;
              const isInc = isIncomeCategory(main);

              return (
                <div
                  key={main.id}
                  className="rounded-xl border border-border/60 bg-card/60 p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: main.color || (isInc ? '#16A34A' : '#2563EB') }}
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
                        <div className="min-w-0 flex items-center gap-2">
                          <div className="text-xs font-semibold text-foreground truncate">{main.name}</div>
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-normal px-1.5 py-0 ${
                              isInc
                                ? 'text-emerald-500 border-emerald-500/30'
                                : 'text-muted-foreground border-border/60'
                            }`}
                          >
                            {isInc ? 'Income' : 'Outcome'}
                          </Badge>
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
        )}
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
