'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  User,
  Building2,
  Users,
  Printer,
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
  Package,
  Calendar,
  RefreshCw,
  Wallet,
  Banknote,
  Gift
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
  balance?: number;
}

interface Transaction {
  id: string;
  date: string;
  type: 'sale' | 'purchase' | 'receipt' | 'payment';
  reference: string;
  description: string;
  paymentType?: string; // للموظفين: salary, advance, bonus, deduction, other
  debit: number;  // لنا (مدين)
  credit: number; // لهم (دائن)
  balance: number;
}

export function AccountStatement() {
  const { currentUser } = useAppStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const [accountType, setAccountType] = useState<'customer' | 'supplier' | 'employee'>('customer');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);

  // Date filters
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCustomers();
    fetchSuppliers();
    fetchEmployees();
    
    // Check for pre-selected account from AccountsPage
    const selectedAccountStr = sessionStorage.getItem('selectedAccount');
    if (selectedAccountStr) {
      try {
        const selectedAccount = JSON.parse(selectedAccountStr);
        sessionStorage.removeItem('selectedAccount'); // Clear after reading
        
        if (selectedAccount.type === 'customer') {
          setAccountType('customer');
          setTimeout(() => {
            setSelectedCustomer({
              id: selectedAccount.id,
              name: selectedAccount.name,
              balance: selectedAccount.balance || 0
            });
            fetchTransactions('customer', selectedAccount.id);
          }, 100);
        } else if (selectedAccount.type === 'supplier') {
          setAccountType('supplier');
          setTimeout(() => {
            setSelectedSupplier({
              id: selectedAccount.id,
              name: selectedAccount.name,
              balance: selectedAccount.balance || 0
            });
            fetchTransactions('supplier', selectedAccount.id);
          }, 100);
        } else if (selectedAccount.type === 'employee') {
          setAccountType('employee');
          setTimeout(() => {
            setSelectedEmployee({
              id: selectedAccount.id,
              name: selectedAccount.name,
              balance: selectedAccount.balance || 0
            });
            fetchTransactions('employee', selectedAccount.id);
          }, 100);
        }
      } catch (e) {
        console.error('Error parsing selected account:', e);
      }
    }
  }, []);

  // Reset selection when account type changes
  useEffect(() => {
    setSelectedCustomer(null);
    setSelectedSupplier(null);
    setSelectedEmployee(null);
    setTransactions([]);
    setSearchTerm('');
  }, [accountType]);

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
    fetchTransactions('customer', customer.id);
  };

  const selectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSearchTerm('');
    setShowSearch(false);
    fetchTransactions('supplier', supplier.id);
  };

  const selectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSearchTerm('');
    setShowSearch(false);
    fetchTransactions('employee', employee.id);
  };

  const fetchTransactions = async (type: 'customer' | 'supplier' | 'employee', id: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        fromDate,
        toDate,
        type,
        id
      });

      const res = await fetch(`/api/account-statement?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setOpeningBalance(data.openingBalance || 0);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (accountType === 'customer' && selectedCustomer) {
      fetchTransactions('customer', selectedCustomer.id);
    } else if (accountType === 'supplier' && selectedSupplier) {
      fetchTransactions('supplier', selectedSupplier.id);
    } else if (accountType === 'employee' && selectedEmployee) {
      fetchTransactions('employee', selectedEmployee.id);
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write(`
          <html dir="rtl">
            <head>
              <title>كشف حساب</title>
              <style>
                body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; direction: rtl; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
                th { background: #f5f5f5; font-weight: bold; }
                .header { text-align: center; margin-bottom: 20px; }
                .header h1 { color: #d97706; margin: 0; }
                .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
                .total-row { background: #f0f0f0; font-weight: bold; }
                .debit { color: #16a34a; }
                .credit { color: #dc2626; }
                @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
              </style>
            </head>
            <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('ar-SA') + ' د.ع';
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ar-SA');
    } catch {
      return dateStr;
    }
  };

  // Calculate totals
  const totalDebit = transactions.reduce((sum, t) => sum + t.debit, 0);
  const totalCredit = transactions.reduce((sum, t) => sum + t.credit, 0);
  const finalBalance = openingBalance + totalDebit - totalCredit;

  const getTransactionIcon = (type: string, paymentType?: string) => {
    // For employee payments, show different icons based on payment type
    if (type === 'payment' && paymentType) {
      switch (paymentType) {
        case 'salary': return <Wallet className="w-4 h-4 text-green-500" />;
        case 'advance': return <Banknote className="w-4 h-4 text-orange-500" />;
        case 'bonus': return <Gift className="w-4 h-4 text-purple-500" />;
        case 'deduction': return <ArrowDownCircle className="w-4 h-4 text-red-500" />;
        default: return <ArrowDownCircle className="w-4 h-4 text-red-500" />;
      }
    }
    
    switch (type) {
      case 'sale': return <Receipt className="w-4 h-4 text-blue-500" />;
      case 'purchase': return <Package className="w-4 h-4 text-purple-500" />;
      case 'receipt': return <ArrowUpCircle className="w-4 h-4 text-green-500" />;
      case 'payment': return <ArrowDownCircle className="w-4 h-4 text-red-500" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'sale': return 'فاتورة بيع';
      case 'purchase': return 'فاتورة شراء';
      case 'receipt': return 'سند قبض';
      case 'payment': return 'سند دفع';
      default: return 'أخرى';
    }
  };

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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">كشف حساب</h1>
              <p className="text-muted-foreground">عرض جميع الحركات المالية للزبون أو المورد</p>
            </div>
          </div>
          {(selectedCustomer || selectedSupplier || selectedEmployee) && (
            <Button onClick={handlePrint} variant="outline">
              <Printer className="w-4 h-4 ml-2" />
              طباعة
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>نوع الحساب</Label>
                <Select value={accountType} onValueChange={(v) => setAccountType(v as 'customer' | 'supplier' | 'employee')}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">زبون</SelectItem>
                    <SelectItem value="supplier">مورد</SelectItem>
                    <SelectItem value="employee">موظف</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label>{accountType === 'customer' ? 'الزبون' : accountType === 'supplier' ? 'المورد' : 'الموظف'}</Label>
                <div className="relative mt-1">
                  <Input
                    value={
                      accountType === 'customer'
                        ? selectedCustomer?.name || searchTerm
                        : accountType === 'supplier'
                        ? selectedSupplier?.name || searchTerm
                        : selectedEmployee?.name || searchTerm
                    }
                    onChange={e => {
                      setSearchTerm(e.target.value);
                      setShowSearch(true);
                      if (accountType === 'customer') setSelectedCustomer(null);
                      else if (accountType === 'supplier') setSelectedSupplier(null);
                      else setSelectedEmployee(null);
                    }}
                    onFocus={() => setShowSearch(true)}
                    placeholder={accountType === 'customer' ? 'ابحث عن زبون...' : accountType === 'supplier' ? 'ابحث عن مورد...' : 'ابحث عن موظف...'}
                  />
                  {showSearch && searchTerm && !selectedCustomer && !selectedSupplier && !selectedEmployee && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                      {accountType === 'customer' ? (
                        filteredCustomers.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">لا توجد نتائج</div>
                        ) : (
                          filteredCustomers.map(customer => (
                            <button
                              key={customer.id}
                              onClick={() => selectCustomer(customer)}
                              className="w-full px-4 py-2 text-right hover:bg-muted flex items-center gap-2"
                            >
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span>{customer.name}</span>
                              <span className="text-muted-foreground text-sm mr-auto">
                                (الرصيد: {(customer.balance || 0).toLocaleString()})
                              </span>
                            </button>
                          ))
                        )
                      ) : accountType === 'supplier' ? (
                        filteredSuppliers.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">لا توجد نتائج</div>
                        ) : (
                          filteredSuppliers.map(supplier => (
                            <button
                              key={supplier.id}
                              onClick={() => selectSupplier(supplier)}
                              className="w-full px-4 py-2 text-right hover:bg-muted flex items-center gap-2"
                            >
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span>{supplier.name}</span>
                              <span className="text-muted-foreground text-sm mr-auto">
                                (الرصيد: {(supplier.balance || 0).toLocaleString()})
                              </span>
                            </button>
                          ))
                        )
                      ) : (
                        filteredEmployees.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">لا توجد نتائج</div>
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
                                <span className="text-muted-foreground text-sm">({employee.phone})</span>
                              )}
                            </button>
                          ))
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-end gap-2">
                <Button onClick={handleRefresh} disabled={loading || (!selectedCustomer && !selectedSupplier && !selectedEmployee)}>
                  <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
                  عرض
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label>من تاريخ</Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>إلى تاريخ</Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Account Info */}
        {(selectedCustomer || selectedSupplier || selectedEmployee) && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  {accountType === 'customer' ? (
                    <User className="w-6 h-6 text-white" />
                  ) : accountType === 'supplier' ? (
                    <Building2 className="w-6 h-6 text-white" />
                  ) : (
                    <Users className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">
                    {accountType === 'customer' ? selectedCustomer?.name : accountType === 'supplier' ? selectedSupplier?.name : selectedEmployee?.name}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {accountType === 'customer' ? selectedCustomer?.phone : accountType === 'supplier' ? selectedSupplier?.phone : selectedEmployee?.phone}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-muted-foreground text-sm">الرصيد الحالي</p>
                  <p className={`text-xl font-bold ${finalBalance > 0 ? 'text-green-600' : finalBalance < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {formatCurrency(Math.abs(finalBalance))}
                    {finalBalance > 0 ? ' (لنا)' : finalBalance < 0 ? ' (لهم)' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statement Table */}
        {(selectedCustomer || selectedSupplier || selectedEmployee) && (
          <Card>
            <CardContent className="p-0" ref={printRef}>
              <div className="p-4 border-b text-center">
                <div className="text-2xl font-digital text-amber-400" style={{ textShadow: '0 0 10px rgba(255, 215, 0, 0.8)' }}>
                  الضيــــــــــاء
                </div>
                <div className="text-lg font-bold mt-2">كشف حساب</div>
                <div className="text-sm text-muted-foreground mt-1">
                  من {formatDate(fromDate)} إلى {formatDate(toDate)}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-right">التاريخ</th>
                      <th className="p-3 text-right">البيان</th>
                      <th className="p-3 text-right">رقم المرجع</th>
                      <th className="p-3 text-right">لنا (مدين)</th>
                      <th className="p-3 text-right">لهم (دائن)</th>
                      <th className="p-3 text-right">الرصيد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Opening Balance */}
                    <tr className="border-t bg-muted/30">
                      <td className="p-3">-</td>
                      <td className="p-3 font-medium">رصيد افتتاحي</td>
                      <td className="p-3">-</td>
                      <td className="p-3">-</td>
                      <td className="p-3">-</td>
                      <td className={`p-3 font-bold ${openingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(openingBalance))}
                        {openingBalance > 0 ? ' (لنا)' : openingBalance < 0 ? ' (لهم)' : ''}
                      </td>
                    </tr>

                    {loading ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                          جاري التحميل...
                        </td>
                      </tr>
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          لا توجد حركات في هذه الفترة
                        </td>
                      </tr>
                    ) : (
                      transactions.map((transaction, index) => (
                        <tr key={transaction.id} className="border-t hover:bg-muted/50">
                          <td className="p-3 text-sm">{formatDate(transaction.date)}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {getTransactionIcon(transaction.type, transaction.paymentType)}
                              <span>{transaction.description}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-sm">{transaction.reference}</td>
                          <td className="p-3 text-green-600 font-medium">
                            {transaction.debit > 0 ? formatCurrency(transaction.debit) : '-'}
                          </td>
                          <td className="p-3 text-red-600 font-medium">
                            {transaction.credit > 0 ? formatCurrency(transaction.credit) : '-'}
                          </td>
                          <td className={`p-3 font-bold ${transaction.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(Math.abs(transaction.balance))}
                            {transaction.balance > 0 ? ' (لنا)' : transaction.balance < 0 ? ' (لهم)' : ''}
                          </td>
                        </tr>
                      ))
                    )}

                    {/* Totals */}
                    {transactions.length > 0 && (
                      <tr className="border-t-2 border-primary bg-primary/10 font-bold">
                        <td className="p-3" colSpan={3}>المجموع</td>
                        <td className="p-3 text-green-600">{formatCurrency(totalDebit)}</td>
                        <td className="p-3 text-red-600">{formatCurrency(totalCredit)}</td>
                        <td className="p-3">-</td>
                      </tr>
                    )}

                    {/* Final Balance */}
                    <tr className="border-t-2 bg-amber-50 font-bold">
                      <td className="p-3" colSpan={3}>الرصيد النهائي</td>
                      <td className="p-3" colSpan={2}>-</td>
                      <td className={`p-3 text-lg ${finalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(finalBalance))}
                        {finalBalance > 0 ? ' (لنا)' : finalBalance < 0 ? ' (لهم)' : ''}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signature Area */}
              <div className="p-4 border-t flex justify-between text-sm">
                <div className="text-center">
                  <div className="text-muted-foreground">المراجع</div>
                  <div className="mt-8 border-b border-dashed w-32"></div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">المدير</div>
                  <div className="mt-8 border-b border-dashed w-32"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!selectedCustomer && !selectedSupplier && !selectedEmployee && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">اختر حساب لعرض الكشف</h3>
              <p className="text-muted-foreground">
                اختر زبون أو مورد أو موظف من القائمة أعلاه لعرض كشف الحساب
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
