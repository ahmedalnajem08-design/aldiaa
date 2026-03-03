'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Building2,
  User,
  FileText,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Plus,
  X,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppStore } from '@/stores/app-store';

interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  balance: number;
}

interface Supplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  balance: number;
}

interface Employee {
  id: string;
  name: string;
  phone?: string;
  balance: number;
}

type AccountType = 'customers' | 'suppliers' | 'employees';

export function AccountsPage() {
  const { setActiveTab } = useAppStore();
  const [accountType, setAccountType] = useState<AccountType>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Add account dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, [accountType]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      if (accountType === 'customers') {
        const res = await fetch('/api/customers');
        if (res.ok) {
          const data = await res.json();
          setCustomers(data.customers || data || []);
        }
      } else if (accountType === 'suppliers') {
        const res = await fetch('/api/suppliers');
        if (res.ok) {
          const data = await res.json();
          setSuppliers(data.suppliers || data || []);
        }
      } else if (accountType === 'employees') {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          setEmployees(data.users || data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAccounts = () => {
    let accounts: any[] = [];
    if (accountType === 'customers') accounts = customers;
    else if (accountType === 'suppliers') accounts = suppliers;
    else if (accountType === 'employees') accounts = employees;

    if (!searchTerm) return accounts;

    return accounts.filter(acc =>
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (acc.phone && acc.phone.includes(searchTerm))
    );
  };

  const getTotals = () => {
    const filtered = getFilteredAccounts();
    const totalDebit = filtered.reduce((sum, acc) => sum + (acc.balance > 0 ? acc.balance : 0), 0);
    const totalCredit = filtered.reduce((sum, acc) => sum + (acc.balance < 0 ? Math.abs(acc.balance) : 0), 0);
    const netBalance = totalDebit - totalCredit;
    return { totalDebit, totalCredit, netBalance, count: filtered.length };
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('ar-SA') + ' د.ع';
  };

  const handleViewStatement = (account: any) => {
    // Navigate to account statement with the selected account
    if (accountType === 'customers') {
      // Store selected customer and navigate
      setActiveTab('account-statement');
      // Pass the customer info via sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('selectedAccount', JSON.stringify({
          type: 'customer',
          id: account.id,
          name: account.name
        }));
      }
    } else if (accountType === 'suppliers') {
      setActiveTab('account-statement');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('selectedAccount', JSON.stringify({
          type: 'supplier',
          id: account.id,
          name: account.name
        }));
      }
    } else if (accountType === 'employees') {
      setActiveTab('account-statement');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('selectedAccount', JSON.stringify({
          type: 'employee',
          id: account.id,
          name: account.name
        }));
      }
    }
  };

  const handleOpenAddDialog = () => {
    setNewName('');
    setNewPhone('');
    setNewAddress('');
    setShowAddDialog(true);
  };

  const handleSaveAccount = async () => {
    if (!newName.trim()) {
      alert('يرجى إدخال اسم الحساب');
      return;
    }

    setSaving(true);
    try {
      if (accountType === 'customers') {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newName,
            phone: newPhone,
            address: newAddress,
            type: 'customer'
          }),
        });
        if (res.ok) {
          alert('تم إضافة الزبون بنجاح');
          setShowAddDialog(false);
          fetchAccounts();
        } else {
          const error = await res.json();
          alert(error.error || 'حدث خطأ أثناء الإضافة');
        }
      } else if (accountType === 'suppliers') {
        const res = await fetch('/api/suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newName,
            phone: newPhone,
            address: newAddress,
            type: 'supplier'
          }),
        });
        if (res.ok) {
          alert('تم إضافة المورد بنجاح');
          setShowAddDialog(false);
          fetchAccounts();
        } else {
          const error = await res.json();
          alert(error.error || 'حدث خطأ أثناء الإضافة');
        }
      }
    } catch (error) {
      console.error('Error saving account:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const getAccountIcon = () => {
    if (accountType === 'customers') return <Users className="w-5 h-5 text-blue-500" />;
    if (accountType === 'suppliers') return <Building2 className="w-5 h-5 text-purple-500" />;
    return <User className="w-5 h-5 text-green-500" />;
  };

  const getTitle = () => {
    if (accountType === 'customers') return 'زبائن';
    if (accountType === 'suppliers') return 'موردين';
    return 'موظفين';
  };

  const getAddButtonLabel = () => {
    if (accountType === 'customers') return 'إضافة زبون';
    if (accountType === 'suppliers') return 'إضافة مورد';
    return 'إضافة موظف';
  };

  const filteredAccounts = getFilteredAccounts();
  const totals = getTotals();

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">الحسابات</h1>
              <p className="text-muted-foreground">إدارة وعرض جميع الحسابات</p>
            </div>
          </div>
          {accountType !== 'employees' && (
            <Button onClick={handleOpenAddDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              {getAddButtonLabel()}
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-sm font-medium">نوع الحساب</label>
                <Select value={accountType} onValueChange={(v) => setAccountType(v as AccountType)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customers">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>زبائن</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="suppliers">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>موردين</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="employees">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>موظفين</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">بحث</label>
                <div className="relative mt-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ابحث بالاسم أو الهاتف..."
                    className="pr-9"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={fetchAccounts} disabled={loading} variant="outline" className="flex-1">
                  <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
                  تحديث
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">عدد {getTitle()}</p>
                  <p className="text-2xl font-bold text-blue-600">{totals.count}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">لنا (مدين)</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.totalDebit)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">لهم (دائن)</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.totalCredit)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${totals.netBalance >= 0 ? 'bg-emerald-50' : 'bg-orange-50'} border-0`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${totals.netBalance >= 0 ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                  {totals.netBalance >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-orange-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">صافي الرصيد</p>
                  <p className={`text-2xl font-bold ${totals.netBalance >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {formatCurrency(Math.abs(totals.netBalance))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accounts Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              {getAccountIcon()}
              <span>قائمة {getTitle()}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-right">#</th>
                    <th className="p-3 text-right">الاسم</th>
                    <th className="p-3 text-right">الهاتف</th>
                    <th className="p-3 text-right">العنوان</th>
                    <th className="p-3 text-right">الرصيد</th>
                    <th className="p-3 text-right">الحالة</th>
                    <th className="p-3 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground">جاري التحميل...</p>
                      </td>
                    </tr>
                  ) : filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        لا توجد حسابات
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((account, index) => (
                      <motion.tr
                        key={account.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-t hover:bg-muted/50"
                      >
                        <td className="p-3 text-muted-foreground">{index + 1}</td>
                        <td className="p-3 font-medium">
                          <div className="flex items-center gap-2">
                            {accountType === 'customers' ? (
                              <Users className="w-4 h-4 text-blue-500" />
                            ) : accountType === 'suppliers' ? (
                              <Building2 className="w-4 h-4 text-purple-500" />
                            ) : (
                              <User className="w-4 h-4 text-green-500" />
                            )}
                            {account.name}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">{account.phone || '-'}</td>
                        <td className="p-3 text-muted-foreground">{account.address || '-'}</td>
                        <td className="p-3 font-bold">
                          {formatCurrency(Math.abs(account.balance || 0))}
                        </td>
                        <td className="p-3">
                          {(account.balance || 0) > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                              <TrendingUp className="w-3 h-3" />
                              لنا
                            </span>
                          ) : (account.balance || 0) < 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
                              <TrendingDown className="w-3 h-3" />
                              لهم
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                              متوازن
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewStatement(account)}
                            className="gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            كشف حساب
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
                {/* Footer Totals */}
                {!loading && filteredAccounts.length > 0 && (
                  <tfoot className="bg-muted/70 font-bold">
                    <tr className="border-t-2">
                      <td className="p-3" colSpan={4}>المجموع الكلي ({totals.count} حساب)</td>
                      <td className="p-3">{formatCurrency(totals.totalDebit)}</td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          {totals.totalDebit > 0 && (
                            <span className="text-green-600 text-sm">لنا: {formatCurrency(totals.totalDebit)}</span>
                          )}
                          {totals.totalCredit > 0 && (
                            <span className="text-red-600 text-sm">لهم: {formatCurrency(totals.totalCredit)}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Account Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getAccountIcon()}
              {getAddButtonLabel()}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>الاسم *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={accountType === 'customers' ? 'اسم الزبون' : 'اسم المورد'}
              />
            </div>
            <div className="space-y-2">
              <Label>الهاتف</Label>
              <Input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="رقم الهاتف"
              />
            </div>
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Input
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="العنوان"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveAccount} disabled={saving || !newName.trim()} className="flex-1">
                <Save className="w-4 h-4 ml-2" />
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                <X className="w-4 h-4 ml-2" />
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
