'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Undo2, Save, Printer, Package, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/stores/app-store';
import { toast } from 'sonner';

interface Supplier {
  id: string;
  name: string;
  phone?: string;
}

interface Warehouse {
  id: string;
  name: string;
  branch?: { name: string };
}

interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  supplierName?: string;
  supplier?: Supplier;
  total: number;
  discount: number;
  items: any[];
  warehouse?: Warehouse;
  createdAt: string;
}

interface ReturnItem {
  id: string;
  materialId: string;
  materialName: string;
  originalQuantity: number;
  returnQuantity: number;
  price: number;
  total: number;
}

export function PurchaseReturn() {
  const { currentUser } = useAppStore();
  
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [showInvoiceSearch, setShowInvoiceSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [showReturnDialog, setShowReturnDialog] = useState(false);

  useEffect(() => {
    fetchWarehouses();
    fetchInvoices();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses');
      const data = await res.json();
      setWarehouses(data.warehouses || data || []);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/purchases');
      const data = await res.json();
      setInvoices(data.invoices || data.purchases || []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = !invoiceSearch || 
      inv.invoiceNumber?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.supplierName?.toLowerCase().includes(invoiceSearch.toLowerCase());
    const matchesWarehouse = !selectedWarehouse || inv.warehouse?.id === selectedWarehouse;
    return matchesSearch && matchesWarehouse;
  });

  const handleSelectInvoice = (invoice: PurchaseInvoice) => {
    setSelectedInvoice(invoice);
    setInvoiceSearch('');
    setShowInvoiceSearch(false);
    
    // Initialize return items from invoice items
    const items: ReturnItem[] = (invoice.items || []).map((item: any) => ({
      id: `return-${item.id || Date.now()}`,
      materialId: item.materialId,
      materialName: item.materialName || item.name,
      originalQuantity: item.quantity,
      returnQuantity: 0,
      price: item.price,
      total: 0
    }));
    setReturnItems(items);
  };

  const updateReturnQuantity = (id: string, quantity: number) => {
    setReturnItems(prev => prev.map(item => {
      if (item.id === id) {
        const qty = Math.min(quantity, item.originalQuantity);
        return {
          ...item,
          returnQuantity: qty,
          total: qty * item.price
        };
      }
      return item;
    }));
  };

  const handleReturn = async () => {
    const validItems = returnItems.filter(i => i.returnQuantity > 0);
    if (validItems.length === 0) {
      toast.error('يرجى تحديد الكميات للإرجاع');
      return;
    }

    if (!selectedInvoice) {
      toast.error('يرجى اختيار قائمة الشراء');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/purchases/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalInvoiceId: selectedInvoice.id,
          items: validItems.map(i => ({
            materialId: i.materialId,
            materialName: i.materialName,
            quantity: i.returnQuantity,
            price: i.price
          })),
          notes,
          createdBy: currentUser?.id
        })
      });

      const result = await res.json();
      
      if (result.success) {
        toast.success('تم إرجاع المشتريات بنجاح');
        setSelectedInvoice(null);
        setReturnItems([]);
        setNotes('');
        setShowReturnDialog(false);
      } else {
        toast.error(result.message || 'حدث خطأ في الإرجاع');
      }
    } catch (error) {
      console.error('Return error:', error);
      toast.error('حدث خطأ في الإرجاع');
    } finally {
      setSaving(false);
    }
  };

  const totalReturn = returnItems.reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
          <Undo2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">إرجاع مشتريات</h1>
          <p className="text-muted-foreground">إرجاع مشتريات إلى المورد</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">اختيار القائمة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Warehouse Filter */}
            <div className="space-y-2">
              <Label>المخزن</Label>
              <Select value={selectedWarehouse || "all"} onValueChange={(v) => setSelectedWarehouse(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="كل المخازن" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المخازن</SelectItem>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} {w.branch?.name && `(${w.branch.name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Invoice Search */}
            <div className="relative space-y-2">
              <Label>بحث عن قائمة</Label>
              <div className="relative">
                <Input
                  placeholder="رقم القائمة أو المورد..."
                  value={invoiceSearch}
                  onChange={(e) => {
                    setInvoiceSearch(e.target.value);
                    setShowInvoiceSearch(true);
                  }}
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>

              {showInvoiceSearch && invoiceSearch && (
                <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-auto">
                  {filteredInvoices.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      لا توجد نتائج
                    </div>
                  ) : (
                    filteredInvoices.slice(0, 10).map((invoice) => (
                      <button
                        key={invoice.id}
                        onClick={() => handleSelectInvoice(invoice)}
                        className="w-full p-3 text-right hover:bg-muted border-b last:border-b-0"
                      >
                        <div className="font-medium">{invoice.supplierName || 'مورد نقدي'}</div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.invoiceNumber || `#${invoice.id.slice(0, 8)}`} • {invoice.total.toLocaleString()} د.ع
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Selected Invoice Info */}
            {selectedInvoice && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-blue-700">القائمة المختارة</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedInvoice(null);
                      setReturnItems([]);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm">{selectedInvoice.supplierName || 'مورد نقدي'}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedInvoice.invoiceNumber || `#${selectedInvoice.id.slice(0, 8)}`}
                </p>
                <p className="text-lg font-bold text-blue-600 mt-2">
                  {selectedInvoice.total.toLocaleString()} د.ع
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items to Return */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">الأصناف للإرجاع</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedInvoice ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>اختر قائمة شراء للإرجاع</p>
              </div>
            ) : returnItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد أصناف في القائمة</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <table className="w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-3 text-right">المادة</th>
                      <th className="p-3 text-right">الكمية الأصلية</th>
                      <th className="p-3 text-right">الكمية للإرجاع</th>
                      <th className="p-3 text-right">السعر</th>
                      <th className="p-3 text-right">المجموع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnItems.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3">{item.materialName}</td>
                        <td className="p-3">{item.originalQuantity}</td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min={0}
                            max={item.originalQuantity}
                            value={item.returnQuantity}
                            onChange={(e) => updateReturnQuantity(item.id, parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                        </td>
                        <td className="p-3">{item.price.toLocaleString()}</td>
                        <td className="p-3 font-medium">{item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            )}

            {/* Summary & Actions */}
            {selectedInvoice && returnItems.length > 0 && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span>إجمالي الإرجاع:</span>
                    <span className="text-xl font-bold text-red-600">{totalReturn.toLocaleString()} د.ع</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {returnItems.filter(i => i.returnQuantity > 0).length} صنف للإرجاع
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="ملاحظات..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <Button
                    onClick={handleReturn}
                    disabled={saving || returnItems.every(i => i.returnQuantity === 0)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Undo2 className="w-4 h-4 ml-2" />
                    {saving ? 'جاري الإرجاع...' : 'تأكيد الإرجاع'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
