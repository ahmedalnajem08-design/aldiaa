'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Receipt,
  Save,
  Search,
  Users,
  Wallet,
  Banknote,
  User,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/stores/app-store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Employee {
  id: string;
  name: string;
  phone?: string;
  balance?: number;
}

export function ExpenseVoucher() {
  const { currentUser } = useAppStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [voucherNumber, setVoucherNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [expenseType, setExpenseType] = useState('general'); // general, employee
  const [employeePaymentType, setEmployeePaymentType] = useState('salary');

  useEffect(() => {
    generateVoucherNumber();
    fetchEmployees();
  }, []);

  // Reset when expense type changes
  useEffect(() => {
    setSelectedEmployee(null);
    setSearchTerm('');
    setDescription('');
    setCategory('');
  }, [expenseType]);

  const generateVoucherNumber = () => {
    const num = `EXP-${Date.now().toString().slice(-8)}`;
    setVoucherNumber(num);
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.users || data || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.phone && e.phone.includes(searchTerm))
  );

  const selectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSearchTerm('');
    setShowSearch(false);
  };

  const handleSave = async () => {
    // Validation for employee payment
    if (expenseType === 'employee' && !selectedEmployee) {
      alert('يرجى اختيار الموظف');
      return;
    }

    // Validation for general expense
    if (expenseType === 'general' && !description) {
      alert('يرجى إدخال وصف المصروف');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherNumber,
          description: expenseType === 'employee' 
            ? `${getEmployeePaymentTypeLabel()} - ${selectedEmployee?.name}`
            : description,
          amount: parseFloat(amount),
          category: expenseType === 'employee' ? 'salary' : category,
          paymentMethod,
          notes,
          createdById: currentUser?.id,
          // Employee payment fields
          expenseType,
          userId: expenseType === 'employee' ? selectedEmployee?.id : null,
          employeePaymentType: expenseType === 'employee' ? employeePaymentType : null,
        }),
      });

      if (res.ok) {
        alert('تم حفظ سند الصرف بنجاح');
        setSelectedEmployee(null);
        setAmount('');
        setDescription('');
        setCategory('');
        setNotes('');
        setPaymentMethod('cash');
        setExpenseType('general');
        setEmployeePaymentType('salary');
        generateVoucherNumber();
      } else {
        const error = await res.json();
        alert(error.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch (error) {
      console.error('Error saving expense voucher:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryLabel = () => {
    switch (category) {
      case 'rent': return 'إيجار';
      case 'electricity': return 'كهرباء';
      case 'water': return 'ماء';
      case 'maintenance': return 'صيانة';
      case 'transport': return 'نقل';
      case 'supplies': return 'مستلزمات';
      case 'salary': return 'رواتب';
      case 'other': return 'أخرى';
      default: return 'مصروف';
    }
  };

  const getEmployeePaymentTypeLabel = () => {
    switch (employeePaymentType) {
      case 'salary': return 'راتب';
      case 'advance': return 'سلفة';
      case 'bonus': return 'مكافأة';
      case 'deduction': return 'خصم';
      case 'other': return 'أخرى';
      default: return 'راتب';
    }
  };

  const getEmployeePaymentTypeIcon = () => {
    switch (employeePaymentType) {
      case 'salary': return <Wallet className="w-4 h-4 text-green-500" />;
      case 'advance': return <Banknote className="w-4 h-4 text-orange-500" />;
      case 'bonus': return <span>🎁</span>;
      case 'deduction': return <span>➖</span>;
      default: return <span>📋</span>;
    }
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">سند صرف</h1>
            <p className="text-muted-foreground">تسجيل المصاريف والنفقات وصرف رواتب الموظفين</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">بيانات السند</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>رقم السند</Label>
                <Input value={voucherNumber} readOnly className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label>نوع الصرف</Label>
                <Select value={expenseType} onValueChange={setExpenseType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4" />
                        <span>مصروف عام</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="employee">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>صرف لموظف</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Employee Selection */}
              {expenseType === 'employee' && (
                <>
                  <div className="space-y-2">
                    <Label>الموظف</Label>
                    <div className="relative">
                      <Input
                        value={selectedEmployee ? selectedEmployee.name : searchTerm}
                        onChange={e => {
                          setSearchTerm(e.target.value);
                          setShowSearch(true);
                          if (!e.target.value) setSelectedEmployee(null);
                        }}
                        onFocus={() => setShowSearch(true)}
                        placeholder="ابحث عن موظف..."
                      />
                      {showSearch && searchTerm && !selectedEmployee && (
                        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                          {filteredEmployees.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground">
                              لا توجد نتائج
                            </div>
                          ) : (
                            filteredEmployees.map(employee => (
                              <button
                                key={employee.id}
                                onClick={() => selectEmployee(employee)}
                                className="w-full px-4 py-2 text-right hover:bg-muted flex items-center gap-2"
                              >
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span>{employee.name}</span>
                                {employee.phone && (
                                  <span className="text-muted-foreground text-sm">
                                    ({employee.phone})
                                  </span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Employee Payment Type */}
                  <div className="space-y-2">
                    <Label>نوع الصرف</Label>
                    <Select value={employeePaymentType} onValueChange={setEmployeePaymentType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salary">
                          <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-green-500" />
                            <span>راتب</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="advance">
                          <div className="flex items-center gap-2">
                            <Banknote className="w-4 h-4 text-orange-500" />
                            <span>سلفة</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="bonus">
                          <div className="flex items-center gap-2">
                            <span>🎁</span>
                            <span>مكافأة</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="deduction">
                          <div className="flex items-center gap-2">
                            <span>➖</span>
                            <span>خصم</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="other">
                          <div className="flex items-center gap-2">
                            <span>📋</span>
                            <span>أخرى</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selected Employee Info */}
                  {selectedEmployee && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex justify-between mb-1">
                        <span className="text-muted-foreground">اسم الموظف:</span>
                        <span className="font-medium">{selectedEmployee.name}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-muted-foreground">نوع الصرف:</span>
                        <div className="flex items-center gap-1">
                          {getEmployeePaymentTypeIcon()}
                          <span className="font-bold text-green-600">{getEmployeePaymentTypeLabel()}</span>
                        </div>
                      </div>
                      {selectedEmployee.phone && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">الهاتف:</span>
                          <span>{selectedEmployee.phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* General Expense Fields */}
              {expenseType === 'general' && (
                <>
                  <div className="space-y-2">
                    <Label>نوع المصروف</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع المصروف" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rent">إيجار</SelectItem>
                        <SelectItem value="electricity">كهرباء</SelectItem>
                        <SelectItem value="water">ماء</SelectItem>
                        <SelectItem value="maintenance">صيانة</SelectItem>
                        <SelectItem value="transport">نقل</SelectItem>
                        <SelectItem value="supplies">مستلزمات</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>وصف المصروف *</Label>
                    <Input
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="مثال: إيجار الشهر الحالي"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>المبلغ *</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>طريقة الدفع</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقداً</SelectItem>
                    <SelectItem value="bank">تحويل بنكي</SelectItem>
                    <SelectItem value="check">شيك</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="ملاحظات..."
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={saving || !amount || (expenseType === 'general' && !description) || (expenseType === 'employee' && !selectedEmployee)}
                className="w-full"
              >
                <Save className="w-4 h-4 ml-2" />
                {saving ? 'جاري الحفظ...' : 'حفظ السند'}
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معاينة السند</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 space-y-4">
                <div className="text-center border-b pb-4">
                  <div className="text-2xl font-digital text-amber-400" style={{ textShadow: '0 0 10px rgba(255, 215, 0, 0.8)' }}>
                    الضيــــــــــاء
                  </div>
                  <div className="text-lg font-bold mt-2">سند صرف</div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">رقم السند:</span>
                    <span className="font-mono">{voucherNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">التاريخ:</span>
                    <span>{new Date().toLocaleDateString('ar-SA')}</span>
                  </div>
                  
                  {expenseType === 'employee' ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">الموظف:</span>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-green-500" />
                          <span>{selectedEmployee?.name || '-'}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">نوع الصرف:</span>
                        <div className="flex items-center gap-1">
                          {getEmployeePaymentTypeIcon()}
                          <span className="font-bold text-green-600">{getEmployeePaymentTypeLabel()}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">نوع المصروف:</span>
                        <span>{category ? getCategoryLabel() : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الوصف:</span>
                        <span>{description || '-'}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="text-center">
                    <div className="text-muted-foreground text-sm">المبلغ</div>
                    <div className="text-3xl font-bold text-orange-600">
                      {parseFloat(amount || '0').toLocaleString() || '0'} د.ع
                    </div>
                    <div className="text-muted-foreground text-sm mt-1">
                      {paymentMethod === 'cash' ? 'نقداً' : paymentMethod === 'bank' ? 'تحويل بنكي' : 'شيك'}
                    </div>
                  </div>
                </div>

                {notes && (
                  <div className="border-t pt-4">
                    <div className="text-muted-foreground text-sm">ملاحظات:</div>
                    <div className="text-sm mt-1">{notes}</div>
                  </div>
                )}

                <div className="border-t pt-4 flex justify-between text-sm">
                  <div className="text-center">
                    <div className="text-muted-foreground">المستلم</div>
                    <div className="mt-8 border-b border-dashed w-32"></div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">الموظف</div>
                    <div className="mt-8 border-b border-dashed w-32"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
