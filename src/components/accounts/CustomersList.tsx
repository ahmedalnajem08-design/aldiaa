'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  MapPin,
  Car,
  User,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/app-store';

interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  carNumber?: string;
  carType?: string;
  type: string;
  balance: number;
  creditLimit?: number;
  notes?: string;
  createdAt: string;
}

export function CustomersList() {
  const { currentUser } = useAppStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    carNumber: '',
    carType: '',
    type: 'regular',
    creditLimit: '',
    notes: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || data || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.carNumber && c.carNumber.includes(searchTerm))
  );

  const openAddDialog = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      address: '',
      carNumber: '',
      carType: '',
      type: 'regular',
      creditLimit: '',
      notes: '',
    });
    setShowDialog(true);
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      carNumber: customer.carNumber || '',
      carType: customer.carType || '',
      type: customer.type || 'regular',
      creditLimit: customer.creditLimit?.toString() || '',
      notes: customer.notes || '',
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('يرجى إدخال اسم العميل');
      return;
    }

    setSaving(true);
    try {
      const url = editingCustomer
        ? `/api/customers/${editingCustomer.id}`
        : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowDialog(false);
        fetchCustomers();
      } else {
        const error = await res.json();
        alert(error.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return;

    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCustomers();
      } else {
        const error = await res.json();
        alert(error.error || 'حدث خطأ أثناء الحذف');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">العملاء</h1>
              <p className="text-muted-foreground">إدارة حسابات العملاء</p>
            </div>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 ml-2" />
            إضافة عميل
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="بحث بالاسم أو الهاتف أو رقم السيارة..."
                className="pr-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  لا يوجد عملاء
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الاسم</TableHead>
                      <TableHead className="text-right">الهاتف</TableHead>
                      <TableHead className="text-right">العنوان</TableHead>
                      <TableHead className="text-right">رقم السيارة</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">الرصيد</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map(customer => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>
                          {customer.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              {customer.phone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {customer.address && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-muted-foreground" />
                              {customer.address}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {customer.carNumber && (
                            <div className="flex items-center gap-1">
                              <Car className="w-3 h-3 text-muted-foreground" />
                              {customer.carNumber}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={customer.type === 'vip' ? 'default' : 'secondary'}>
                            {customer.type === 'vip' ? 'مميز' : 'عادي'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={(customer.balance || 0) > 0 ? 'text-red-600 font-bold' : ''}>
                            {(customer.balance || 0).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(customer)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(customer.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? 'تعديل عميل' : 'إضافة عميل جديد'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>الاسم *</Label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="اسم العميل"
                />
              </div>
              <div className="space-y-2">
                <Label>الهاتف</Label>
                <Input
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="رقم الهاتف"
                />
              </div>
              <div className="space-y-2">
                <Label>العنوان</Label>
                <Input
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="العنوان"
                />
              </div>
              <div className="space-y-2">
                <Label>رقم السيارة</Label>
                <Input
                  value={formData.carNumber}
                  onChange={e => setFormData({ ...formData, carNumber: e.target.value })}
                  placeholder="رقم السيارة"
                />
              </div>
              <div className="space-y-2">
                <Label>نوع السيارة</Label>
                <Input
                  value={formData.carType}
                  onChange={e => setFormData({ ...formData, carType: e.target.value })}
                  placeholder="نوع السيارة"
                />
              </div>
              <div className="space-y-2">
                <Label>حد الائتمان</Label>
                <Input
                  type="number"
                  value={formData.creditLimit}
                  onChange={e => setFormData({ ...formData, creditLimit: e.target.value })}
                  placeholder="حد الائتمان"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>ملاحظات</Label>
                <Input
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ملاحظات..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
