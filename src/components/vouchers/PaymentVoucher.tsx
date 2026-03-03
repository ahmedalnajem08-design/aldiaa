'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Banknote,
  Save,
  User,
  Building2
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

interface Supplier {
  id: string;
  name: string;
  phone?: string;
  balance: number;
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
  balance: number;
}

export function PaymentVoucher() {
  const { currentUser } = useAppStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [voucherNumber, setVoucherNumber] = useState('');
  const [payeeType, setPayeeType] = useState('supplier');

  useEffect(() => {
    generateVoucherNumber();
    fetchSuppliers();
    fetchCustomers();
  }, []);

  // Reset selection when payee type changes
  useEffect(() => {
    setSelectedSupplier(null);
    setSelectedCustomer(null);
    setSearchTerm('');
  }, [payeeType]);

  const generateVoucherNumber = () => {
    const num = `PV-${Date.now().toString().slice(-8)}`;
    setVoucherNumber(num);
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

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.phone && s.phone.includes(searchTerm))
  );

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  const selectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSearchTerm('');
    setShowSearch(false);
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchTerm('');
    setShowSearch(false);
  };

  const handleSave = async () => {
    if (payeeType === 'supplier' && !selectedSupplier) {
      alert('يرجى اختيار المورد');
      return;
    }

    if (payeeType === 'customer' && !selectedCustomer) {
      alert('يرجى اختيار الزبون');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/vouchers/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherNumber,
          supplierId: payeeType === 'supplier' ? selectedSupplier?.id : null,
          customerId: payeeType === 'customer' ? selectedCustomer?.id : null,
          payeeType,
          amount: parseFloat(amount),
          paymentMethod,
          notes,
          createdById: currentUser?.id,
        }),
      });

      if (res.ok) {
        alert('تم حفظ سند الدفع بنجاح');
        setSelectedSupplier(null);
        setSelectedCustomer(null);
        setAmount('');
        setNotes('');
        setPaymentMethod('cash');
        generateVoucherNumber();
      } else {
        const error = await res.json();
        alert(error.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch (error) {
      console.error('Error saving payment voucher:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const getPayeeName = () => {
    if (payeeType === 'supplier') return selectedSupplier?.name || '-';
    if (payeeType === 'customer') return selectedCustomer?.name || '-';
    if (payeeType === 'expense') return 'مصروف';
    return 'أخرى';
  };

  const getPayeeIcon = () => {
    if (payeeType === 'supplier') return <Building2 className="w-4 h-4 text-purple-500" />;
    if (payeeType === 'customer') return <User className="w-4 h-4 text-blue-500" />;
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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
            <Banknote className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">سند دفع</h1>
            <p className="text-muted-foreground">صرف مبلغ للمورد أو الزبون</p>
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
                <Label>نوع المستفيد</Label>
                <Select value={payeeType} onValueChange={setPayeeType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supplier">مورد</SelectItem>
                    <SelectItem value="customer">زبون</SelectItem>
                    <SelectItem value="expense">مصروف</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Supplier Search */}
              {payeeType === 'supplier' && (
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

              {/* Customer Search */}
              {payeeType === 'customer' && (
                <div className="space-y-2">
                  <Label>الزبون</Label>
                  <div className="relative">
                    <Input
                      value={selectedCustomer ? selectedCustomer.name : searchTerm}
                      onChange={e => {
                        setSearchTerm(e.target.value);
                        setShowSearch(true);
                        if (!e.target.value) setSelectedCustomer(null);
                      }}
                      onFocus={() => setShowSearch(true)}
                      placeholder="ابحث عن زبون..."
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

              {/* Selected Info */}
              {selectedSupplier && payeeType === 'supplier' && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">اسم المورد:</span>
                    <span className="font-medium">{selectedSupplier.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الرصيد المستحق:</span>
                    <span className={`font-bold ${(selectedSupplier.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {(selectedSupplier.balance || 0).toLocaleString()} د.ع
                    </span>
                  </div>
                </div>
              )}

              {selectedCustomer && payeeType === 'customer' && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">اسم الزبون:</span>
                    <span className="font-medium">{selectedCustomer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الرصيد المستحق:</span>
                    <span className={`font-bold ${(selectedCustomer.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {(selectedCustomer.balance || 0).toLocaleString()} د.ع
                    </span>
                  </div>
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
                disabled={saving || (payeeType === 'supplier' && !selectedSupplier) || (payeeType === 'customer' && !selectedCustomer)}
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
                  <div className="text-lg font-bold mt-2">سند دفع</div>
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
                    <span className="text-muted-foreground">المستفيد:</span>
                    <div className="flex items-center gap-1">
                      {getPayeeIcon()}
                      <span>{getPayeeName()}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-center">
                    <div className="text-muted-foreground text-sm">المبلغ</div>
                    <div className="text-3xl font-bold text-red-600">
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
