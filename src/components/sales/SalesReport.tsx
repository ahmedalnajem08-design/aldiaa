/* eslint-disable react-hooks/immutability */
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, FileText, User, Printer, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Customer {
  id: string;
  name: string;
  phone?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer?: Customer;
  total: number;
  paid: number;
  status: 'cash' | 'credit' | 'partial';
  items: any[];
  createdAt: string;
}

interface Stats {
  totalCash: number;
  totalCredit: number;
  totalPartial: number;
  countCash: number;
  countCredit: number;
  countPartial: number;
}

export function SalesReport() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  
  const [fromDate, setFromDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  
  useEffect(() => {
    searchInvoices();
  }, [fromDate, toDate, selectedCustomer]);
  
  const searchCustomers = async (query: string) => {
    if (!query) {
      setCustomers([]);
      return;
    }
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('Failed to search customers:', error);
    }
  };
  
  const searchInvoices = async () => {
    try {
      let url = `/api/sales?fromDate=${fromDate}&toDate=${toDate}`;
      if (selectedCustomer) {
        url += `&customerId=${selectedCustomer.id}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      setInvoices(data.invoices || []);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    }
  };
  
  const handleOpenInvoice = async (invoice: Invoice) => {
    try {
      const res = await fetch(`/api/sales?id=${invoice.id}`);
      const data = await res.json();
      setSelectedInvoice(data.invoice);
      setShowInvoiceDialog(true);
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
    }
  };
  
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">كشف المبيعات</h1>
        <p className="text-muted-foreground">عرض وتتبع قوائم المبيعات</p>
      </div>
      
      {/* Search Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Customer Search */}
            <div className="relative">
              <Label>الزبون</Label>
              <div className="relative mt-1">
                <Input
                  placeholder="بحث عن زبون..."
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    searchCustomers(e.target.value);
                    setShowCustomerSearch(true);
                  }}
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              
              {showCustomerSearch && customers.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-auto">
                  {customers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setCustomerSearch(customer.name);
                        setShowCustomerSearch(false);
                      }}
                      className="w-full p-3 text-right hover:bg-muted"
                    >
                      {customer.name}
                    </button>
                  ))}
                </div>
              )}
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
                  setSelectedCustomer(null);
                  setCustomerSearch('');
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
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">النقدية</p>
                  <p className="text-2xl font-bold text-green-700">{stats.totalCash.toLocaleString()} د.ع</p>
                  <p className="text-xs text-green-500">{stats.countCash} قائمة</p>
                </div>
                <Badge className="bg-green-500">نقد</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">الآجلة</p>
                  <p className="text-2xl font-bold text-red-700">{stats.totalCredit.toLocaleString()} د.ع</p>
                  <p className="text-xs text-red-500">{stats.countCredit} قائمة</p>
                </div>
                <Badge variant="destructive">آجل</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600">الجزئية</p>
                  <p className="text-2xl font-bold text-amber-700">{stats.totalPartial.toLocaleString()} د.ع</p>
                  <p className="text-xs text-amber-500">{stats.countPartial} قائمة</p>
                </div>
                <Badge className="bg-amber-500">جزئي</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>قوائم البيع ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
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
                        <div className={`w-3 h-3 rounded-full ${
                          invoice.status === 'cash' ? 'bg-green-500' :
                          invoice.status === 'credit' ? 'bg-red-500' : 'bg-amber-500'
                        }`} />
                        <div>
                          <p className="font-medium">{invoice.customer?.name || 'زبون نقدي'}</p>
                          <p className="text-sm text-muted-foreground">
                            {invoice.invoiceNumber} • {new Date(invoice.createdAt).toLocaleString('ar-SA')}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-lg">{invoice.total.toLocaleString()} د.ع</p>
                        <Badge variant={
                          invoice.status === 'cash' ? 'default' :
                          invoice.status === 'credit' ? 'destructive' : 'secondary'
                        }>
                          {invoice.status === 'cash' ? 'نقد' :
                           invoice.status === 'credit' ? 'آجل' : 'جزئي'}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد قوائم في هذه الفترة</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Invoice Details Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>تفاصيل القائمة</span>
              <Button variant="outline" size="sm">
                <Printer className="w-4 h-4 ml-2" />
                طباعة
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground text-sm">الزبون:</span>
                    <p className="font-medium">{selectedInvoice.customer?.name || 'زبون نقدي'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">رقم القائمة:</span>
                    <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">التاريخ:</span>
                    <p className="font-medium">{new Date(selectedInvoice.createdAt).toLocaleString('ar-SA')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">الحالة:</span>
                    <Badge variant={
                      selectedInvoice.status === 'cash' ? 'default' :
                      selectedInvoice.status === 'credit' ? 'destructive' : 'secondary'
                    }>
                      {selectedInvoice.status === 'cash' ? 'نقد' :
                       selectedInvoice.status === 'credit' ? 'آجل' : 'جزئي'}
                    </Badge>
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
                        <td className="p-3">{item.materialName}</td>
                        <td className="p-3">{item.quantity}</td>
                        <td className="p-3">{item.price}</td>
                        <td className="p-3 font-medium">{item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Total */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <span className="text-lg font-bold">المجموع:</span>
                <span className="text-2xl font-bold text-green-600">
                  {selectedInvoice.total.toLocaleString()} د.ع
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
