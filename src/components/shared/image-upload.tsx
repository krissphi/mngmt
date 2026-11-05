'use client';

import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  maxDimension?: number;
}

export function ImageUpload({
  value,
  onChange,
  label = 'Product / Asset Image',
  maxDimension = 600,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/webp', 0.8);
          onChange(compressedBase64);
        }
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
    // Reset file input so user can re-select the same file if desired
    e.target.value = '';
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground block">{label}</label>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {value ? (
        <div className="flex items-center gap-3 p-2 rounded-lg border border-border/60 bg-muted/20">
          <div className="size-14 rounded-md overflow-hidden bg-muted relative shrink-0 border border-border/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Preview" className="size-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">Image Attached</p>
            <p className="text-[10px] text-muted-foreground">Optimized WebP format</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => fileInputRef.current?.click()}
            >
              Change
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
              onClick={() => onChange('')}
              title="Remove image"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border/70 hover:border-primary/50 bg-muted/10 hover:bg-muted/30 rounded-lg p-3 text-center cursor-pointer transition-colors flex items-center justify-center gap-2.5 text-xs text-muted-foreground"
        >
          <div className="size-7 rounded-full bg-muted flex items-center justify-center">
            <Upload className="size-3.5 text-muted-foreground" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-foreground">Upload Image</span>
            <span className="text-[11px] text-muted-foreground block">Auto-compressed to WebP</span>
          </div>
        </div>
      )}
    </div>
  );
}

