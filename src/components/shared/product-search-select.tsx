'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Product } from '@/types';
import { formatIDR } from '@/lib/currency';
import { Search, Check, ChevronDown } from 'lucide-react';

interface ProductSearchSelectProps {
  products: Product[];
  selectedProductId: string;
  onSelect: (product: Product) => void;
  showCost?: boolean;
}

export function ProductSearchSelect({
  products,
  selectedProductId,
  onSelect,
  showCost = false,
}: ProductSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q))
    );
  }, [products, query]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={() => setIsOpen(true)}
        className="w-full h-9 rounded-md border border-input bg-card px-3 flex items-center justify-between cursor-pointer text-xs transition-colors hover:border-border/80 focus-within:ring-1 focus-within:ring-primary"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 pr-1">
          <Search className="size-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            className="w-full bg-transparent border-none outline-hidden text-xs text-foreground placeholder:text-muted-foreground cursor-pointer"
            placeholder="Search product name, SKU..."
            value={isOpen ? query : selectedProduct ? selectedProduct.name : ''}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => {
              setIsOpen(true);
              setQuery('');
            }}
          />
        </div>
        <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
          {selectedProduct && !isOpen && (
            <span className="text-[11px] font-semibold text-primary px-1.5 py-0.5 rounded bg-primary/10">
              Stock: {selectedProduct.stockOnHand}
            </span>
          )}
          <ChevronDown className={`size-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Floating Live Search Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-popover shadow-md divide-y divide-border/40 animate-in fade-in-50 zoom-in-95 duration-100">
          {filtered.length === 0 ? (
            <div className="p-3 text-center text-xs text-muted-foreground">
              No products found matching &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((prod) => {
              const isSelected = prod.id === selectedProductId;
              return (
                <div
                  key={prod.id}
                  onClick={() => {
                    onSelect(prod);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={`p-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/60 text-foreground'
                  }`}
                >
                  <div className="min-w-0 pr-2 space-y-0.5">
                    <div className="font-medium truncate">{prod.name}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                      <span className="font-mono">{prod.sku}</span>
                      <span>•</span>
                      <span>Stock: <b>{prod.stockOnHand} pcs</b></span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-foreground">
                      {formatIDR(showCost ? prod.purchaseCost : prod.sellingPrice)}
                    </div>
                    {isSelected && <Check className="size-3.5 text-primary ml-auto mt-0.5" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
