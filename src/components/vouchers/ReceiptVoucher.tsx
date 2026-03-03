'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  HandCoins,
  Save,
  Search,
  User,
  Building2,
  Users
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
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/stores/app-store';

interface Customer {
  id: string;
  name: string;
  phone?: string;
  balance: number;
}

interface Supplier {
  id: string;
  name: string;
  phone?: string;
  balance: number;
}

interface Employee {
  id: string;
  name: string;
  phone?: string;
  balance?: number;
}

export function ReceiptVoucher() {
  const { currentUser } = useAppStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [payerType, setPayerType] = useState('customer');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [voucherNumber, setVoucherNumber] = useState('');

  useEffect(() => {
    generateVoucherNumber();
    fetchCustomers();
    fetchSuppliers();
    fetchEmployees();
  }, []);

  // Reset selection when payer type changes
  useEffect(() => {
    setSelectedCustomer(null);
    setSelectedSupplier(null);
    setSelectedEmployee(null);
    setSearchTerm('');
  }, [payerType]);

  const generateVoucherNumber = () => {
    const num = `RV-${Date.now().toString().slice(-8)}`;
    setVoucherNumber(num);
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || data || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.suppliers || data || []);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
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

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.phone && s.phone.includes(searchTerm))
  );

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.phone && e.phone.includes(searchTerm))
  );

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchTerm('');
    setShowSearch(false);
  };

  const selectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSearchTerm('');
    setShowSearch(false);
  };

  const selectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSearchTerm('');
    setShowSearch(false);
  };

  const handleSave = async () => {
    if (payerType === 'customer' && !selectedCustomer) {
      alert('يرجى اختيار العميل');
      return;
    }

    if (payerType === 'supplier' && !selectedSupplier) {
      alert('يرجى اختيار المورد');
      return;
    }

    if (payerType === 'employee' && !selectedEmployee) {
      alert('يرجى اختيار الموظف');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/vouchers/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherNumber,
          customerId: payerType === 'customer' ? selectedCustomer?.id : null,
          supplierId: payerType === 'supplier' ? selectedSupplier?.id : null,
          userId: payerType === 'employee' ? selectedEmployee?.id : null,
          payerType,
          amount: parseFloat(amount),
          paymentMethod,
          notes,
          createdById: currentUser?.id,
        }),
      });

      if (res.ok) {
        alert('تم حفظ سند القبض بنجاح');
        setSelectedCustomer(null);
        setSelectedSupplier(null);
        setSelectedEmployee(null);
        setAmount('');
        setNotes('');
        setPaymentMethod('cash');
        generateVoucherNumber();
      } else {
        const error = await res.json();
        alert(error.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch (error) {
      console.error('Error saving receipt voucher:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const getPayerName = () => {
    if (payerType === 'customer') return selectedCustomer?.name || '-';
    if (payerType === 'supplier') return selectedSupplier?.name || '-';
    if (payerType === 'employee') return selectedEmployee?.name || '-';
    if (payerType === 'other') return 'أخرى';
    return '-';
  };

  const getPayerIcon = () => {
    if (payerType === 'customer') return <User className="w-4 h-4 text-blue-500" />;
    if (payerType === 'supplier') return <Building2 className="w-4 h-4 text-purple-500" />;
    if (payerType === 'employee') return <Users className="w-4 h-4 text-green-500" />;
    return null;
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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <HandCoins className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">سند قبض</h1>
            <p className="text-muted-foreground">استلام مبلغ من العميل أو المورد أو الموظف</p>
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
                <Label>نوع الدافع</Label>
                <Select value={payerType} onValueChange={setPayerType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">زبون</SelectItem>
                    <SelectItem value="supplier">مورد</SelectItem>
                    <SelectItem value="employee">موظف</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Customer Search */}
              {payerType === 'customer' && (
                <div className="space-y-2">
                  <Label>العميل</Label>
                  <div className="relative">
                    <Input
                      value={selectedCustomer ? selectedCustomer.name : searchTerm}
                      onChange={e => {
                        setSearchTerm(e.target.value);
                        setShowSearch(true);
                        if (!e.target.value) setSelectedCustomer(null);
                      }}
                      onFocus={() => setShowSearch(true)}
                      placeholder="ابحث عن عميل..."
                    />
                    {showSearch && searchTerm && !selectedCustomer && (
                      <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                        {filteredCustomers.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            لا توجد نتائج
                          </div>
                        ) : (
                          filteredCustomers.map(customer => (
                            <button
                              key={customer.id}
                              onClick={() => selectCustomer(customer)}
                              className="w-full px-4 py-2 text-right hover:bg-muted flex items-center gap-2"
                            >
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span>{customer.name}</span>
                              <span className="text-muted-foreground text-sm">
                                (الرصيد: {(customer.balance || 0).toLocaleString()})
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Supplier Search */}
              {payerType === 'supplier' && (
                <div className="space-y-2">
                  <Label>المورد</Label>
                  <div className="relative">
                    <Input
                      value={selectedSupplier ? selectedSupplier.name : searchTerm}
                      onChange={e => {
                        setSearchTerm(e.target.value);
                        setShowSearch(true);
                        if (!e.target.value) setSelectedSupplier(null);
                      }}
                      onFocus={() => setShowSearch(true)}
                      placeholder="ابحث عن مورد..."
                    />
                    {showSearch && searchTerm && !selectedSupplier && (
                      <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                        {filteredSuppliers.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            لا توجد نتائج
                          </div>
                        ) : (
                          filteredSuppliers.map(supplier => (
                            <button
                              key={supplier.id}
                              onClick={() => selectSupplier(supplier)}
                              className="w-full px-4 py-2 text-right hover:bg-muted flex items-center gap-2"
                            >
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span>{supplier.name}</span>
                              <span className="text-muted-foreground text-sm">
                                (الرصيد: {(supplier.balance || 0).toLocaleString()})
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Employee Search */}
              {payerType === 'employee' && (
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
              )}

              {/* Selected Info */}
              {selectedCustomer && payerType === 'customer' && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">اسم العميل:</span>
                    <span className="font-medium">{selectedCustomer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الرصيد الحالي:</span>
                    <span className={`font-bold ${(selectedCustomer.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {(selectedCustomer.balance || 0).toLocaleString()} د.ع
                    </span>
                  </div>
                </div>
              )}

              {selectedSupplier && payerType === 'supplier' && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">اسم المورد:</span>
                    <span className="font-medium">{selectedSupplier.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الرصيد الحالي:</span>
                    <span className={`font-bold ${(selectedSupplier.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {(selectedSupplier.balance || 0).toLocaleString()} د.ع
                    </span>
                  </div>
                </div>
              )}

              {selectedEmployee && payerType === 'employee' && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">اسم الموظف:</span>
                    <span className="font-medium">{selectedEmployee.name}</span>
                  </div>
                  {selectedEmployee.phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الهاتف:</span>
                      <span>{selectedEmployee.phone}</span>
                    </div>
                  )}
                </div>
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
                disabled={saving || (payerType === 'customer' && !selectedCustomer) || (payerType === 'supplier' && !selectedSupplier) || (payerType === 'employee' && !selectedEmployee)}
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
                  <div className="text-lg font-bold mt-2">سند قبض</div>
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
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">الدافع:</span>
                    <div className="flex items-center gap-1">
                      {getPayerIcon()}
                      <span>{getPayerName()}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-center">
                    <div className="text-muted-foreground text-sm">المبلغ</div>
                    <div className="text-3xl font-bold text-green-600">
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
