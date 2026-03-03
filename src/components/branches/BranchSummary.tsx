'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, Calendar, ArrowRightLeft, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAppStore } from '@/stores/app-store';
import { toast } from 'sonner';

interface BranchSummaryProps {
  onBack: () => void;
}

interface Branch {
  id: string;
  name: string;
}

interface BranchStats {
  cashSales: number;
  creditSales: number;
  cashPurchases: number;
  creditPurchases: number;
  expenses: number;
  receipts: number;
  payments: number;
  net: number;
}

export function BranchSummary({ onBack }: BranchSummaryProps) {
  const { currentUser } = useAppStore();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState<BranchStats | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Transfer to cash register
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchStats();
    }
  }, [selectedBranch, dateFilter, customDate]);

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      const data = await res.json();
      setBranches(data.branches || []);
      if (data.branches?.length > 0) {
        setSelectedBranch(data.branches[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      let startDate = new Date();
      let endDate = new Date();
      
      if (dateFilter === 'today') {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (dateFilter === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (dateFilter === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (dateFilter === 'custom') {
        startDate = new Date(customDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(customDate);
        endDate.setHours(23, 59, 59, 999);
      }

      const res = await fetch(
        `/api/branches/${selectedBranch}/stats?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
      );
      const data = await res.json();
      setStats(data.stats || {
        cashSales: 0,
        creditSales: 0,
        cashPurchases: 0,
        creditPurchases: 0,
        expenses: 0,
        receipts: 0,
        payments: 0,
        net: 0
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({
        cashSales: 0,
        creditSales: 0,
        cashPurchases: 0,
        creditPurchases: 0,
        expenses: 0,
        receipts: 0,
        payments: 0,
        net: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }

    setTransferring(true);
    try {
      const res = await fetch('/api/cash-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranch,
          amount: parseFloat(transferAmount),
          date: dateFilter === 'custom' ? customDate : new Date().toISOString(),
          createdBy: currentUser?.id
        })
      });

      if (res.ok) {
        toast.success('تم التحويل إلى القاصة بنجاح');
        setShowTransferDialog(false);
        setTransferAmount('');
        fetchStats();
      } else {
        throw new Error('Transfer failed');
      }
    } catch (error) {
      toast.error('حدث خطأ في التحويل');
    } finally {
      setTransferring(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('ar-IQ');
  };

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">ملخص الفرع</h1>
            <p className="text-muted-foreground">عرض ملخص الحركات المالية للفرع</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Filter */}
              <div>
                <Label>الفترة الزمنية</Label>
                <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as any)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">اليوم</SelectItem>
                    <SelectItem value="week">آخر أسبوع</SelectItem>
                    <SelectItem value="month">آخر شهر</SelectItem>
                    <SelectItem value="custom">تاريخ محدد</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date */}
              {dateFilter === 'custom' && (
                <div>
                  <Label>التاريخ</Label>
                  <Input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}

              {/* Branch Select */}
              <div>
                <Label>الفرع</Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              ملخص الحركات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                جاري التحميل...
              </div>
            ) : stats ? (
              <table className="w-full">
                <tbody>
                  <tr className="border-b bg-green-50">
                    <td className="p-4 font-medium">المبيعات النقدية</td>
                    <td className="p-4 text-left font-bold text-green-600">
                      {formatNumber(stats.cashSales)} د.ع
                    </td>
                  </tr>
                  <tr className="border-b bg-red-50">
                    <td className="p-4 font-medium">المبيعات الآجلة</td>
                    <td className="p-4 text-left font-bold text-red-600">
                      {formatNumber(stats.creditSales)} د.ع
                    </td>
                  </tr>
                  <tr className="border-b bg-blue-50">
                    <td className="p-4 font-medium">المشتريات النقدية</td>
                    <td className="p-4 text-left font-bold text-blue-600">
                      {formatNumber(stats.cashPurchases)} د.ع
                    </td>
                  </tr>
                  <tr className="border-b bg-orange-50">
                    <td className="p-4 font-medium">المشتريات الآجلة</td>
                    <td className="p-4 text-left font-bold text-orange-600">
                      {formatNumber(stats.creditPurchases)} د.ع
                    </td>
                  </tr>
                  <tr className="border-b bg-purple-50">
                    <td className="p-4 font-medium">الصرفيات</td>
                    <td className="p-4 text-left font-bold text-purple-600">
                      {formatNumber(stats.expenses)} د.ع
                    </td>
                  </tr>
                  <tr className="border-b bg-teal-50">
                    <td className="p-4 font-medium">المقبوضات</td>
                    <td className="p-4 text-left font-bold text-teal-600">
                      {formatNumber(stats.receipts)} د.ع
                    </td>
                  </tr>
                  <tr className="border-b bg-rose-50">
                    <td className="p-4 font-medium">المدفوعات</td>
                    <td className="p-4 text-left font-bold text-rose-600">
                      {formatNumber(stats.payments)} د.ع
                    </td>
                  </tr>
                  <tr className="bg-gray-100">
                    <td className="p-4 font-bold text-lg">الصافي</td>
                    <td className={`p-4 text-left font-bold text-xl ${stats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatNumber(stats.net)} د.ع
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                لا توجد بيانات
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transfer to Cash Register Button */}
        <Button
          onClick={() => setShowTransferDialog(true)}
          className="w-full h-14 text-lg bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
        >
          <ArrowRightLeft className="w-6 h-6 ml-2" />
          تحويل إلى القاصة
        </Button>
      </motion.div>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              تحويل إلى القاصة
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">الفرع:</div>
              <div className="font-medium">
                {branches.find(b => b.id === selectedBranch)?.name}
              </div>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">الصافي:</div>
              <div className={`font-bold text-xl ${stats && stats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats ? formatNumber(stats.net) : 0} د.ع
              </div>
            </div>

            <div>
              <Label>المبلغ المراد تحويله</Label>
              <Input
                type="number"
                placeholder="0"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="mt-1 text-lg"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleTransfer} disabled={transferring}>
              {transferring ? 'جاري التحويل...' : 'تحويل'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
