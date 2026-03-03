'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Wallet,
  Package,
  Building,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Branch {
  id: string;
  name: string;
}

interface Summary {
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  totalReceived: number; // سندات قبض
  totalPaid: number; // سندات دفع
  totalCredit: number; // المديونية
  inventoryValue: number; // قيمة المخزون
  profit: number;
  netCash: number;
}

export function AccountSummary() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Date filters
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [summary, setSummary] = useState<Summary>({
    totalSales: 0,
    totalPurchases: 0,
    totalExpenses: 0,
    totalReceived: 0,
    totalPaid: 0,
    totalCredit: 0,
    inventoryValue: 0,
    profit: 0,
    netCash: 0
  });

  useEffect(() => {
    fetchBranches();
    fetchSummary();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      const data = await res.json();
      setBranches(data.branches || data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchSummary = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [salesRes, purchasesRes, expensesRes, vouchersRes, materialsRes] = await Promise.all([
        fetch(`/api/sales?fromDate=${fromDate}&toDate=${toDate}${selectedBranch ? `&branchId=${selectedBranch}` : ''}`),
        fetch(`/api/purchases?fromDate=${fromDate}&toDate=${toDate}${selectedBranch ? `&branchId=${selectedBranch}` : ''}`),
        fetch(`/api/expenses?fromDate=${fromDate}&toDate=${toDate}${selectedBranch ? `&branchId=${selectedBranch}` : ''}`),
        fetch(`/api/vouchers/summary?fromDate=${fromDate}&toDate=${toDate}${selectedBranch ? `&branchId=${selectedBranch}` : ''}`),
        fetch(`/api/materials/summary${selectedBranch ? `?branchId=${selectedBranch}` : ''}`)
      ]);

      const salesData = await salesRes.json();
      const purchasesData = await purchasesRes.json();
      const expensesData = await expensesRes.json();
      const vouchersData = await vouchersRes.json().catch(() => ({ received: 0, paid: 0 }));
      const materialsData = await materialsRes.json().catch(() => ({ value: 0 }));

      const totalSales = (salesData.invoices || []).reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
      const totalPurchases = (purchasesData.invoices || []).reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
      const totalExpenses = (expensesData.expenses || expensesData || []).reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
      
      // Calculate credit (unpaid sales)
      const totalCredit = (salesData.invoices || [])
        .filter((inv: any) => inv.status === 'credit' || inv.status === 'partial')
        .reduce((sum: number, inv: any) => sum + ((inv.total || 0) - (inv.paid || 0)), 0);

      // Inventory value
      const inventoryValue = (materialsData.materials || materialsData || []).reduce((sum: number, m: any) => 
        sum + ((m.quantity || 0) * (m.purchasePrice || 0)), 0);

      // Calculate profit (sales - purchases cost)
      const salesCost = (salesData.invoices || []).reduce((sum: number, inv: any) => {
        return sum + (inv.items || []).reduce((itemSum: number, item: any) => 
          itemSum + ((item.purchasePrice || 0) * (item.quantity || 0)), 0);
      }, 0);
      
      const profit = totalSales - salesCost;

      // Net cash calculation
      const netCash = (vouchersData.received || 0) - (vouchersData.paid || 0) - totalExpenses;

      setSummary({
        totalSales,
        totalPurchases,
        totalExpenses,
        totalReceived: vouchersData.received || 0,
        totalPaid: vouchersData.paid || 0,
        totalCredit,
        inventoryValue,
        profit,
        netCash
      });
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('ar-SA') + ' د.ع';
  };

  const summaryItems = [
    {
      title: 'نطلب (المستحق لنا)',
      value: summary.totalCredit,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'مديونية العملاء'
    },
    {
      title: 'مطلوبين (الواجب علينا)',
      value: summary.totalPurchases - summary.totalPaid,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'مديونية الموردين'
    },
    {
      title: 'فلوس حالياً',
      value: summary.netCash,
      icon: Wallet,
      color: summary.netCash >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: summary.netCash >= 0 ? 'bg-green-50' : 'bg-red-50',
      description: 'الرصيد النقدي'
    },
    {
      title: 'صرفياتنا',
      value: summary.totalExpenses,
      icon: TrendingDown,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'إجمالي المصاريف'
    },
    {
      title: 'البضاعة الموجودة',
      value: summary.inventoryValue,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'قيمة المخزون'
    },
    {
      title: 'الأرباح',
      value: summary.profit,
      icon: TrendingUp,
      color: summary.profit >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: summary.profit >= 0 ? 'bg-green-50' : 'bg-red-50',
      description: 'صافي الربح'
    }
  ];

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Calculator className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">الملخص الحسابي</h1>
          <p className="text-muted-foreground">نظرة شاملة على الحالة المالية</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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

            <div>
              <Label>من تاريخ</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>إلى تاريخ</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <Button onClick={fetchSummary} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`${item.bgColor} border-0`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <h3 className="text-lg font-bold mt-1">{item.title}</h3>
                      <p className={`text-3xl font-bold mt-2 ${item.color}`}>
                        {formatCurrency(item.value)}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${item.color} bg-white/50`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Detailed Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل الحركة المالية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-right">البند</th>
                  <th className="p-3 text-right">المبلغ</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3">إجمالي المبيعات</td>
                  <td className="p-3 font-bold text-green-600">{formatCurrency(summary.totalSales)}</td>
                </tr>
                <tr className="border-t bg-muted/30">
                  <td className="p-3">إجمالي المشتريات</td>
                  <td className="p-3 font-bold text-blue-600">{formatCurrency(summary.totalPurchases)}</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">إجمالي المصاريف</td>
                  <td className="p-3 font-bold text-red-600">{formatCurrency(summary.totalExpenses)}</td>
                </tr>
                <tr className="border-t bg-muted/30">
                  <td className="p-3">سندات القبض</td>
                  <td className="p-3 font-bold text-green-600">{formatCurrency(summary.totalReceived)}</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">سندات الدفع</td>
                  <td className="p-3 font-bold text-red-600">{formatCurrency(summary.totalPaid)}</td>
                </tr>
                <tr className="border-t bg-muted/30">
                  <td className="p-3">مديونية العملاء</td>
                  <td className="p-3 font-bold text-blue-600">{formatCurrency(summary.totalCredit)}</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">قيمة المخزون</td>
                  <td className="p-3 font-bold text-purple-600">{formatCurrency(summary.inventoryValue)}</td>
                </tr>
                <tr className="border-t-2 border-primary bg-primary/10">
                  <td className="p-3 font-bold text-lg">صافي الربح</td>
                  <td className={`p-3 font-bold text-lg ${summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(summary.profit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
