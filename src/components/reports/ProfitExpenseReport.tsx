'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Search,
  Building
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Branch {
  id: string;
  name: string;
}

interface ProfitData {
  totalSales: number;
  totalCost: number;
  totalProfit: number;
  invoices: any[];
}

interface ExpenseData {
  totalExpenses: number;
  expenses: any[];
}

export function ProfitExpenseReport() {
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

  const [profitData, setProfitData] = useState<ProfitData>({
    totalSales: 0,
    totalCost: 0,
    totalProfit: 0,
    invoices: []
  });

  const [expenseData, setExpenseData] = useState<ExpenseData>({
    totalExpenses: 0,
    expenses: []
  });

  useEffect(() => {
    fetchBranches();
    fetchData();
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

  const fetchData = async () => {
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('fromDate', fromDate);
      params.append('toDate', toDate);
      if (selectedBranch) params.append('branchId', selectedBranch);

      // Fetch sales for profit calculation
      const salesRes = await fetch(`/api/sales?${params.toString()}`);
      const salesData = await salesRes.json();
      const invoices = salesData.invoices || [];

      // Calculate profits
      let totalSales = 0;
      let totalCost = 0;

      const invoicesWithProfit = invoices.map((inv: any) => {
        const cost = inv.items?.reduce((sum: number, item: any) => {
          return sum + ((item.purchasePrice || 0) * item.quantity);
        }, 0) || 0;
        const profit = inv.total - cost;
        totalSales += inv.total;
        totalCost += cost;
        return { ...inv, cost, profit };
      });

      setProfitData({
        totalSales,
        totalCost,
        totalProfit: totalSales - totalCost,
        invoices: invoicesWithProfit
      });

      // Fetch expenses
      const expensesRes = await fetch(`/api/expenses?${params.toString()}`);
      const expensesData = await expensesRes.json();
      const expenses = expensesData.expenses || expensesData || [];

      setExpenseData({
        totalExpenses: expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0),
        expenses
      });

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('ar-SA') + ' د.ع';
  };

  const netResult = profitData.totalProfit - expenseData.totalExpenses;

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <LayoutDashboard className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">تقرير الأرباح والمصاريف</h1>
          <p className="text-muted-foreground">مقارنة الأرباح مع المصاريف</p>
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

            <Button onClick={fetchData} disabled={loading}>
              <Search className="w-4 h-4 ml-2" />
              تنفيذ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two Tables Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profits Table */}
        <Card>
          <CardHeader className="bg-green-50 border-b">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <TrendingUp className="w-5 h-5" />
              جدول الأرباح
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-3 text-right">القائمة</th>
                    <th className="p-3 text-right">المبيعات</th>
                    <th className="p-3 text-right">التكلفة</th>
                    <th className="p-3 text-right">الربح</th>
                  </tr>
                </thead>
                <tbody>
                  {profitData.invoices.map((inv: any) => (
                    <tr key={inv.id} className="border-t">
                      <td className="p-3">{inv.invoiceNumber}</td>
                      <td className="p-3">{formatCurrency(inv.total)}</td>
                      <td className="p-3 text-orange-600">{formatCurrency(inv.cost)}</td>
                      <td className={`p-3 font-bold ${inv.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(inv.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
            <div className="p-4 bg-green-50 border-t flex justify-between">
              <span className="font-bold">مجموع الأرباح:</span>
              <span className="font-bold text-green-600 text-lg">{formatCurrency(profitData.totalProfit)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card>
          <CardHeader className="bg-red-50 border-b">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <TrendingDown className="w-5 h-5" />
              جدول المصاريف
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-3 text-right">السند</th>
                    <th className="p-3 text-right">البيان</th>
                    <th className="p-3 text-right">المبلغ</th>
                    <th className="p-3 text-right">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseData.expenses.map((exp: any) => (
                    <tr key={exp.id} className="border-t">
                      <td className="p-3 font-mono">{exp.voucherNumber}</td>
                      <td className="p-3">{exp.description}</td>
                      <td className="p-3 font-bold text-red-600">{formatCurrency(exp.amount)}</td>
                      <td className="p-3">{new Date(exp.createdAt).toLocaleDateString('ar-SA')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
            <div className="p-4 bg-red-50 border-t flex justify-between">
              <span className="font-bold">مجموع المصاريف:</span>
              <span className="font-bold text-red-600 text-lg">{formatCurrency(expenseData.totalExpenses)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Final Result */}
      <Card className={`${netResult >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground mb-2">النتيجة النهائية (الأرباح - المصاريف)</p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(profitData.totalProfit)} - {formatCurrency(expenseData.totalExpenses)}
              </p>
            </div>
            <div className="text-left">
              <p className={`text-4xl font-bold ${netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netResult)}
              </p>
              <p className={`text-sm ${netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netResult >= 0 ? 'ربح صافي' : 'خسارة'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
