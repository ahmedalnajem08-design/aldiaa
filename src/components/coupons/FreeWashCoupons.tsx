'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Car,
  Plus,
  Search,
  Edit,
  Trash2,
  Gift,
  CheckCircle,
  XCircle
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

interface Coupon {
  id: string;
  couponNumber: string;
  customerName: string;
  carNumber?: string;
  carType?: string;
  phone?: string;
  status: 'active' | 'used' | 'expired';
  issuedAt: string;
  usedAt?: string;
  expiryDate?: string;
  notes?: string;
  issuedBy?: { name: string };
}

export function FreeWashCoupons() {
  const { currentUser } = useAppStore();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    carNumber: '',
    carType: '',
    phone: '',
    expiryDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCoupons = coupons.filter(c =>
    c.couponNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.carNumber && c.carNumber.includes(searchTerm))
  );

  const openAddDialog = () => {
    setFormData({
      customerName: '',
      carNumber: '',
      carType: '',
      phone: '',
      expiryDate: '',
      notes: '',
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.customerName.trim()) {
      alert('يرجى إدخال اسم العميل');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdById: currentUser?.id,
        }),
      });

      if (res.ok) {
        setShowDialog(false);
        fetchCoupons();
      } else {
        const error = await res.json();
        alert(error.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const markCouponAsUsed = async (id: string) => {
    if (!confirm('هل أنت متأكد من استخدام هذا الكوبون؟')) return;

    try {
      const res = await fetch(`/api/coupons/${id}/use`, { method: 'POST' });
      if (res.ok) {
        fetchCoupons();
      } else {
        const error = await res.json();
        alert(error.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error using coupon:', error);
      alert('حدث خطأ');
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return;

    try {
      const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCoupons();
      } else {
        const error = await res.json();
        alert(error.error || 'حدث خطأ أثناء الحذف');
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA');
  };

  const activeCoupons = coupons.filter(c => c.status === 'active').length;
  const usedCoupons = coupons.filter(c => c.status === 'used').length;

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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">كوبونات الغسيل المجاني</h1>
              <p className="text-muted-foreground">إدارة كوبونات غسيل السيارات المجانية</p>
            </div>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 ml-2" />
            كوبون جديد
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">إجمالي الكوبونات</div>
                  <div className="text-2xl font-bold">{coupons.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">الكوبونات النشطة</div>
                  <div className="text-2xl font-bold text-green-600">{activeCoupons}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">الكوبونات المستخدمة</div>
                  <div className="text-2xl font-bold text-gray-600">{usedCoupons}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="بحث برقم الكوبون أو اسم العميل أو رقم السيارة..."
                className="pr-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Coupons Table */}
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredCoupons.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  لا توجد كوبونات
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الكوبون</TableHead>
                      <TableHead className="text-right">العميل</TableHead>
                      <TableHead className="text-right">رقم السيارة</TableHead>
                      <TableHead className="text-right">الهاتف</TableHead>
                      <TableHead className="text-right">تاريخ الإصدار</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCoupons.map(coupon => (
                      <TableRow key={coupon.id}>
                        <TableCell className="font-mono">{coupon.couponNumber}</TableCell>
                        <TableCell>{coupon.customerName}</TableCell>
                        <TableCell>
                          {coupon.carNumber && (
                            <div className="flex items-center gap-1">
                              <Car className="w-3 h-3 text-muted-foreground" />
                              {coupon.carNumber}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{coupon.phone || '-'}</TableCell>
                        <TableCell>{formatDate(coupon.issuedAt)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={coupon.status === 'active' ? 'default' : 'secondary'}
                            className={coupon.status === 'active' ? 'bg-green-500' : ''}
                          >
                            {coupon.status === 'active' ? 'نشط' : coupon.status === 'used' ? 'مستخدم' : 'منتهي'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {coupon.status === 'active' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => markCouponAsUsed(coupon.id)}
                                title="استخدام"
                              >
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteCoupon(coupon.id)}
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

        {/* Add Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>إصدار كوبون غسيل مجاني</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>اسم العميل *</Label>
                <Input
                  value={formData.customerName}
                  onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="اسم العميل"
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
                  placeholder="مثال: تويوتا كامري"
                />
              </div>
              <div className="space-y-2">
                <Label>رقم الهاتف</Label>
                <Input
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="رقم الهاتف"
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ الانتهاء</Label>
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
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
                {saving ? 'جاري الحفظ...' : 'إصدار الكوبون'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
