'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Search,
  Calendar,
  FileText,
  Building,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  customer?: { name: string };
  items: any[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  status: string;
  createdAt: string;
  branchId?: string;
  warehouseId?: string;
  warehouse?: { name: string; branch?: { name: string } };
}

interface Branch {
  id: string;
  name: string;
}

interface Stats {
  totalSales: number;
  totalCost: number;
  totalProfit: number;
  count: number;
}

export function ProfitsReport() {
  const [invoices, setInvoices] = useState<SaleInvoice[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

  // Date filters
  const [dateFilter, setDateFilter] = useState<'today' | 'custom' | 'all'>('all');
  const [fromDate, setFromDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [stats, setStats] = useState<Stats>({
    totalSales: 0,
    totalCost: 0,
    totalProfit: 0,
    count: 0
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [selectedBranch, dateFilter, fromDate, toDate]);

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      const data = await res.json();
      setBranches(data.branches || data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let url = '/api/sales?';
      
      if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        url += `fromDate=${today}&toDate=${today}`;
      } else if (dateFilter === 'custom') {
        url += `fromDate=${fromDate}&toDate=${toDate}`;
      }
      
      if (selectedBranch) {
        url += `&branchId=${selectedBranch}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      const invoiceList = data.invoices || [];
      
      // Calculate profits for each invoice
      const invoicesWithProfit = invoiceList.map((inv: SaleInvoice) => {
        // Calculate cost (purchase price * quantity for each item)
        const cost = inv.items?.reduce((sum: number, item: any) => {
          return sum + ((item.purchasePrice || 0) * item.quantity);
        }, 0) || 0;
        
        const profit = inv.total - cost;
        
        return {
          ...inv,
          cost,
          profit
        };
      });
      
      setInvoices(invoicesWithProfit);
      
      // Calculate totals
      const totalSales = invoicesWithProfit.reduce((sum: number, inv: any) => sum + inv.total, 0);
      const totalCost = invoicesWithProfit.reduce((sum: number, inv: any) => sum + inv.cost, 0);
      const totalProfit = invoicesWithProfit.reduce((sum: number, inv: any) => sum + inv.profit, 0);
      
      setStats({
        totalSales,
        totalCost,
        totalProfit,
        count: invoicesWithProfit.length
      });
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInvoice = (invoice: SaleInvoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDialog(true);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('ar-SA') + ' د.ع';
  };

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">تقرير الأرباح</h1>
          <p className="text-muted-foreground">عرض الأرباح من قوائم البيع</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            {/* Branch Filter */}
            <div>
              <Label>الفرع</Label>
              <Select value={selectedBranch || "all"} onValueChange={(v) => setSelectedBranch(v === "all" ? "" : v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="جميع الفروع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفروع</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter Type */}
            <div>
              <Label>الفترة الزمنية</Label>
              <Select value={dateFilter} onValueChange={(v: any) => setDateFilter(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأوقات</SelectItem>
                  <SelectItem value="today">اليوم</SelectItem>
                  <SelectItem value="custom">فترة محددة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* From Date */}
            {dateFilter === 'custom' && (
              <div>
                <Label>من تاريخ</Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            {/* To Date */}
            {dateFilter === 'custom' && (
              <div>
                <Label>إلى تاريخ</Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            {/* Execute Button */}
            <Button onClick={fetchInvoices} disabled={loading}>
              <Search className="w-4 h-4 ml-2" />
              تنفيذ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-600">عدد القوائم</p>
            <p className="text-2xl font-bold text-blue-700">{stats.count}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <p className="text-sm text-purple-600">إجمالي المبيعات</p>
            <p className="text-2xl font-bold text-purple-700">{formatCurrency(stats.totalSales)}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <p className="text-sm text-orange-600">إجمالي التكلفة</p>
            <p className="text-2xl font-bold text-orange-700">{formatCurrency(stats.totalCost)}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <p className="text-sm text-green-600">إجمالي الأرباح</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(stats.totalProfit)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>قوائم البيع مع الأرباح</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد قوائم في هذه الفترة</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-3 text-right">رقم القائمة</th>
                    <th className="p-3 text-right">الزبون</th>
                    <th className="p-3 text-right">التاريخ</th>
                    <th className="p-3 text-right">المبيعات</th>
                    <th className="p-3 text-right">التكلفة</th>
                    <th className="p-3 text-right">الربح</th>
                    <th className="p-3 text-right">الحالة</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice: any) => (
                    <tr key={invoice.id} className="border-t hover:bg-muted/50">
                      <td className="p-3 font-mono">{invoice.invoiceNumber}</td>
                      <td className="p-3">{invoice.customer?.name || 'زبون نقدي'}</td>
                      <td className="p-3">{new Date(invoice.createdAt).toLocaleDateString('ar-SA')}</td>
                      <td className="p-3">{formatCurrency(invoice.total)}</td>
                      <td className="p-3 text-orange-600">{formatCurrency(invoice.cost)}</td>
                      <td className={`p-3 font-bold ${invoice.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(invoice.profit)}
                      </td>
                      <td className="p-3">
                        <Badge variant={invoice.status === 'cash' ? 'default' : invoice.status === 'credit' ? 'destructive' : 'secondary'}>
                          {invoice.status === 'cash' ? 'نقد' : invoice.status === 'credit' ? 'آجل' : 'جزئي'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenInvoice(invoice)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Invoice Details Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل القائمة {selectedInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <span className="text-muted-foreground">الزبون:</span>
                  <span className="mr-2">{selectedInvoice.customer?.name || 'زبون نقدي'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">التاريخ:</span>
                  <span className="mr-2">{new Date(selectedInvoice.createdAt).toLocaleString('ar-SA')}</span>
                </div>
              </div>
              
              <table className="w-full border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-right">المادة</th>
                    <th className="p-3 text-right">العدد</th>
                    <th className="p-3 text-right">السعر</th>
                    <th className="p-3 text-right">المجموع</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="border-t">
                      <td className="p-3">{item.materialName}</td>
                      <td className="p-3">{item.quantity}</td>
                      <td className="p-3">{item.price?.toLocaleString()}</td>
                      <td className="p-3">{(item.total || item.quantity * item.price)?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="p-4 bg-green-50 rounded-lg flex justify-between">
                <span className="font-bold">المجموع:</span>
                <span className="font-bold text-green-600">{formatCurrency(selectedInvoice.total)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
