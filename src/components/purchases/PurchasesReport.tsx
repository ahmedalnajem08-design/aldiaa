'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, Printer, X, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  status: 'completed' | 'pending' | 'returned';
  items: any[];
  warehouse?: Warehouse;
  createdAt: string;
}

interface Stats {
  total: number;
  count: number;
  totalDiscount: number;
}

export function PurchasesReport() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierSearch, setShowSupplierSearch] = useState(false);
  
  const [fromDate, setFromDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    searchInvoices();
  }, [fromDate, toDate, selectedSupplier, selectedWarehouse]);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses');
      const data = await res.json();
      setWarehouses(data.warehouses || data || []);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    }
  };

  const searchSuppliers = async (query: string) => {
    if (!query) {
      setSuppliers([]);
      return;
    }
    try {
      const res = await fetch(`/api/suppliers?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSuppliers(data.suppliers || data || []);
    } catch (error) {
      console.error('Failed to search suppliers:', error);
    }
  };

  const searchInvoices = async () => {
    setLoading(true);
    try {
      let url = `/api/purchases?fromDate=${fromDate}&toDate=${toDate}`;
      if (selectedSupplier) {
        url += `&supplierId=${selectedSupplier}`;
      }
      if (selectedWarehouse) {
        url += `&warehouseId=${selectedWarehouse}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      setInvoices(data.invoices || data.purchases || []);
      
      // Calculate stats
      const total = (data.invoices || data.purchases || []).reduce((sum: number, inv: PurchaseInvoice) => sum + inv.total, 0);
      const totalDiscount = (data.invoices || data.purchases || []).reduce((sum: number, inv: PurchaseInvoice) => sum + (inv.discount || 0), 0);
      setStats({
        total,
        count: (data.invoices || data.purchases || []).length,
        totalDiscount
      });
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInvoice = async (invoice: PurchaseInvoice) => {
    try {
      const res = await fetch(`/api/purchases/${invoice.id}`);
      const data = await res.json();
      setSelectedInvoice(data.invoice || data);
      setShowInvoiceDialog(true);
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      // Use the invoice data we already have
      setSelectedInvoice(invoice);
      setShowInvoiceDialog(true);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <Package className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">كشف المشتريات</h1>
          <p className="text-muted-foreground">عرض وتتبع قوائم الشراء</p>
        </div>
      </div>
      
      {/* Search Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Supplier Search */}
            <div className="relative">
              <Label>المورد</Label>
              <div className="relative mt-1">
                <Input
                  placeholder="بحث عن مورد..."
                  value={supplierSearch}
                  onChange={(e) => {
                    setSupplierSearch(e.target.value);
                    searchSuppliers(e.target.value);
                    setShowSupplierSearch(true);
                  }}
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              
              {showSupplierSearch && suppliers.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-auto">
                  {suppliers.map((supplier) => (
                    <button
                      key={supplier.id}
                      onClick={() => {
                        setSelectedSupplier(supplier.id);
                        setSupplierSearch(supplier.name);
                        setShowSupplierSearch(false);
                      }}
                      className="w-full p-3 text-right hover:bg-muted"
                    >
                      {supplier.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Warehouse */}
            <div>
              <Label>المخزن</Label>
              <Select value={selectedWarehouse || "all"} onValueChange={(v) => setSelectedWarehouse(v === "all" ? "" : v)}>
                <SelectTrigger className="mt-1">
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
            
            {/* From Date */}
            <div>
              <Label>من تاريخ</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1"
              />
            </div>
            
            {/* To Date */}
            <div>
              <Label>إلى تاريخ</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-1"
              />
            </div>
            
            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedSupplier('');
                  setSupplierSearch('');
                  setSelectedWarehouse('');
                  const today = new Date();
                  setFromDate(today.toISOString().split('T')[0]);
                  setToDate(today.toISOString().split('T')[0]);
                }}
                className="w-full"
              >
                <X className="w-4 h-4 ml-2" />
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">إجمالي المشتريات</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.total.toLocaleString()} د.ع</p>
                </div>
                <Badge className="bg-blue-500">المجموع</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">عدد القوائم</p>
                  <p className="text-2xl font-bold text-green-700">{stats.count}</p>
                </div>
                <Badge className="bg-green-500">العدد</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600">إجمالي الخصومات</p>
                  <p className="text-2xl font-bold text-amber-700">{stats.totalDiscount.toLocaleString()} د.ع</p>
                </div>
                <Badge className="bg-amber-500">خصم</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>قوائم الشراء ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : invoices.length > 0 ? (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-2">
                {invoices.map((invoice, index) => (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleOpenInvoice(invoice)}
                    className="p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{invoice.supplierName || invoice.supplier?.name || 'مورد نقدي'}</p>
                          <p className="text-sm text-muted-foreground">
                            {invoice.invoiceNumber || `#${invoice.id.slice(0, 8)}`} • {new Date(invoice.createdAt).toLocaleString('ar-SA')}
                          </p>
                          {invoice.warehouse && (
                            <p className="text-xs text-muted-foreground">المخزن: {invoice.warehouse.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-lg">{invoice.total.toLocaleString()} د.ع</p>
                        {invoice.discount > 0 && (
                          <p className="text-sm text-muted-foreground">خصم: {invoice.discount.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد قوائم شراء في هذه الفترة</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Invoice Details Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>تفاصيل قائمة الشراء</span>
              <Button variant="outline" size="sm">
                <Printer className="w-4 h-4 ml-2" />
                طباعة
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-4">
              {/* Supplier Info */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground text-sm">المورد:</span>
                    <p className="font-medium">{selectedInvoice.supplierName || selectedInvoice.supplier?.name || 'مورد نقدي'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">رقم القائمة:</span>
                    <p className="font-medium">{selectedInvoice.invoiceNumber || selectedInvoice.id.slice(0, 8)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">التاريخ:</span>
                    <p className="font-medium">{new Date(selectedInvoice.createdAt).toLocaleString('ar-SA')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">المخزن:</span>
                    <p className="font-medium">{selectedInvoice.warehouse?.name || '-'}</p>
                  </div>
                </div>
              </div>
              
              {/* Items Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-right">المادة</th>
                      <th className="p-3 text-right">العدد</th>
                      <th className="p-3 text-right">السعر</th>
                      <th className="p-3 text-right">المجموع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items?.map((item: any, index: number) => (
                      <tr key={index} className="border-t">
                        <td className="p-3">{item.materialName || item.name}</td>
                        <td className="p-3">{item.quantity}</td>
                        <td className="p-3">{item.price?.toLocaleString()}</td>
                        <td className="p-3 font-medium">{(item.total || item.quantity * item.price)?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Total */}
              <div className="space-y-2">
                {selectedInvoice.discount > 0 && (
                  <div className="flex items-center justify-between p-2 bg-amber-50 rounded-lg">
                    <span>الخصم:</span>
                    <span className="font-medium text-amber-600">{selectedInvoice.discount.toLocaleString()} د.ع</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <span className="text-lg font-bold">المجموع:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {selectedInvoice.total.toLocaleString()} د.ع
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
