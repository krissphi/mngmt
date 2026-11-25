'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { Supplier } from '@/types';
import { SummaryBanner } from '@/components/shared/summary-banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/states/state-views';
import { Truck, Plus, Pencil, Trash2, Phone, Mail, MapPin } from 'lucide-react';

export function SuppliersTab() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const { withPhoneCount, withEmailCount } = useMemo(() => {
    let phones = 0;
    let emails = 0;
    for (const s of suppliers) {
      if (s.phone) phones++;
      if (s.email) emails++;
    }
    return { withPhoneCount: phones, withEmailCount: emails };
  }, [suppliers]);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setNotes('');
    setDialogOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setName(s.name);
    setContactPerson(s.contactPerson || '');
    setPhone(s.phone || '');
    setEmail(s.email || '');
    setAddress(s.address || '');
    setNotes(s.notes || '');
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      contactPerson: contactPerson.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    if (editing) {
      updateSupplier(editing.id, payload);
    } else {
      addSupplier(payload);
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <SummaryBanner
        label="Registered Suppliers"
        value={`${suppliers.length} ${suppliers.length === 1 ? 'Vendor' : 'Vendors'}`}
        meta={[`${withPhoneCount} With Phone`, `${withEmailCount} With Email`]}
        actions={
          <Button
            onClick={openAdd}
            size="sm"
            className="text-xs h-8.5 gap-1.5 bg-foreground text-background hover:bg-foreground/90 font-medium rounded-lg shadow-sm"
          >
            <Plus className="size-3.5" />
            <span>Add Supplier</span>
          </Button>
        }
      />

      {suppliers.length === 0 ? (
        <EmptyState
          icon={<Truck className="size-8" />}
          title="No Suppliers Added"
          description="Register wholesalers, forwarders, or packaging vendors for quicker stock restocking."
          action={
            <Button onClick={openAdd} size="sm">
              + Add Supplier
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((sup) => (
            <div
              key={sup.id}
              className="group rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs p-5 hover:border-border/90 hover:bg-card/90 transition-all duration-200 flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-9 rounded-xl flex items-center justify-center shrink-0 border bg-sky-500/10 border-sky-500/20 text-sky-500">
                    <Truck className="size-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-foreground leading-snug break-words">{sup.name}</h4>
                    {sup.contactPerson && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">PIC: {sup.contactPerson}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-75 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(sup)}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/60 transition-colors"
                    title="Edit supplier"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleting(sup)}
                    className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-md hover:bg-accent/60 transition-colors"
                    title="Delete supplier"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                {sup.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-3.5 shrink-0 text-muted-foreground/70" />
                    <span className="font-mono text-foreground">{sup.phone}</span>
                  </div>
                )}
                {sup.email && (
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="size-3.5 shrink-0 text-muted-foreground/70" />
                    <span className="truncate">{sup.email}</span>
                  </div>
                )}
                {sup.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="size-3.5 shrink-0 mt-0.5 text-muted-foreground/70" />
                    <span className="line-clamp-2">{sup.address}</span>
                  </div>
                )}
              </div>

              {sup.notes && (
                <p className="text-[11px] text-muted-foreground/80 pt-3 border-t border-border/40 line-clamp-2">
                  {sup.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editing ? 'Edit Supplier' : 'Add New Supplier'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Maintain supplier contact details for inventory restocks.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Supplier / Company Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. PT Hobby Toys" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Contact Person</label>
                <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="e.g. Budi" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Phone / WhatsApp</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812..." />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Email (Optional)</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sales@vendor.com" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Address (Optional)</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Warehouse or store address" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Notes (Optional)</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Product lines, lead time..." />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary text-primary-foreground">
                {editing ? 'Save Changes' : 'Save Supplier'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete Supplier?"
        description={`Are you sure you want to remove "${deleting?.name}"? Existing products will retain their inventory records.`}
        confirmText="Delete Supplier"
        cancelText="Cancel"
        onConfirm={() => {
          if (deleting) {
            deleteSupplier(deleting.id);
            setDeleting(null);
          }
        }}
      />
    </div>
  );
}
