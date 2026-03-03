'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Receipt,
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
  FileText,
  Building
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/stores/app-store';
import { toast } from 'sonner';

interface Expense {
  id: string;
  voucherNumber: string;
  description: string;
  amount: number;
  category?: string;
  branchId?: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
  user?: { name: string };
}

interface Branch {
  id: string;
  name: string;
}

export function ExpensesReport() {
  const { currentUser } = useAppStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [totalExpenses, setTotalExpenses] = useState(0);

  // Date filters
  const [dateFilter, setDateFilter] = useState<'today' | 'custom' | 'all'>('all');
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Dialog
  const [showDialog, setShowDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'general',
    notes: ''
  });

  useEffect(() => {
    fetchBranches();
    fetchExpenses();
  }, []);

  useEffect(() => {
    fetchExpenses();
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

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      let url = '/api/expenses?';
      
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
      const expenseList = data.expenses || data || [];
      setExpenses(expenseList);
      setTotalExpenses(expenseList.reduce((sum: number, e: Expense) => sum + e.amount, 0));
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        description: expense.description,
        amount: expense.amount.toString(),
        category: expense.category || 'general',
        notes: expense.notes || ''
      });
    } else {
      setEditingExpense(null);
      setFormData({
        description: '',
        amount: '',
        category: 'general',
        notes: ''
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.description || !formData.amount) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setSaving(true);
    try {
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses';
      const method = editingExpense ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          branchId: selectedBranch || undefined,
          createdBy: currentUser?.id
        })
      });

      const result = await res.json();
      
      if (result.success) {
        toast.success(editingExpense ? 'تم تحديث السند' : 'تم إضافة السند');
        setShowDialog(false);
        fetchExpenses();
      } else {
        toast.error(result.message || 'حدث خطأ');
      }
    } catch (error) {
      toast.error('حدث خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السند؟')) return;
    
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      const result = await res.json();
      
      if (result.success) {
        toast.success('تم حذف السند');
        fetchExpenses();
      } else {
        toast.error(result.message || 'حدث خطأ');
      }
    } catch (error) {
      toast.error('حدث خطأ في الحذف');
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('ar-SA') + ' د.ع';
  };

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">تقرير المصاريف</h1>
            <p className="text-muted-foreground">سندات الصرف والمصاريف</p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة سند صرف
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
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

            {dateFilter === 'custom' && (
              <>
                <div>
                  <Label>من تاريخ</Label>
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>إلى تاريخ</Label>
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="mt-1" />
                </div>
              </>
            )}

            <Button onClick={fetchExpenses} disabled={loading}>
              <Search className="w-4 h-4 ml-2" />
              تنفيذ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-red-600">إجمالي المصاريف</p>
            <p className="text-3xl font-bold text-red-700">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="text-left">
            <p className="text-sm text-red-600">عدد السندات</p>
            <p className="text-2xl font-bold text-red-700">{expenses.length}</p>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>سندات الصرف</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد سندات صرف</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-3 text-right">رقم السند</th>
                    <th className="p-3 text-right">البيان</th>
                    <th className="p-3 text-right">التصنيف</th>
                    <th className="p-3 text-right">المبلغ</th>
                    <th className="p-3 text-right">التاريخ</th>
                    <th className="p-3 text-right">المستخدم</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <motion.tr
                      key={expense.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-t hover:bg-muted/50"
                    >
                      <td className="p-3 font-mono">{expense.voucherNumber}</td>
                      <td className="p-3">{expense.description}</td>
                      <td className="p-3">{expense.category || '-'}</td>
                      <td className="p-3 font-bold text-red-600">{formatCurrency(expense.amount)}</td>
                      <td className="p-3">{new Date(expense.createdAt).toLocaleDateString('ar-SA')}</td>
                      <td className="p-3">{expense.user?.name || '-'}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(expense)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)} className="text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'تعديل سند الصرف' : 'إضافة سند صرف جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>البيان *</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف المصروف"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>المبلغ *</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>التصنيف</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">عام</SelectItem>
                    <SelectItem value="salary">رواتب</SelectItem>
                    <SelectItem value="maintenance">صيانة</SelectItem>
                    <SelectItem value="supplies">مستلزمات</SelectItem>
                    <SelectItem value="utilities">فواتير</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ملاحظات..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
