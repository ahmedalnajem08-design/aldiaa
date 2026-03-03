'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Save, Building2, User, Phone, MapPin, Lock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppStore } from '@/stores/app-store';
import { toast } from 'sonner';

interface AddBranchFormProps {
  onBack: () => void;
}

const defaultPermissions = {
  // صلاحيات البيع
  canSale: true,
  canChangePrice: false,
  canCreditSale: true,
  canViewPurchasePrice: false,
  canEditSaleInvoice: false,
  canDeleteSaleInvoice: false,
  canEditSaleDate: false,
  canGiveFreeWash: false,
  canPartialPayment: true,
  
  // صلاحيات الشراء
  canPurchase: true,
  canEditPurchaseInvoice: false,
  canDeletePurchaseInvoice: false,
  canPurchaseReturn: false,
  
  // صلاحيات المخازن
  canViewMaterials: true,
  canEditMaterial: false,
  canDeleteMaterial: false,
  canAddMaterial: false,
  canWarehouseTransfer: false,
  canTransferBetweenBranches: false,
  canTransferBetweenWarehouses: false,
  canInventoryCount: false,
  canInventoryAdjustment: false,
  
  // صلاحيات الحسابات
  canViewAccounts: true,
  canEditCustomer: false,
  canEditSupplier: false,
  canPaymentVoucher: false,
  canPaymentDisbursement: false,
  canExpense: false,
  
  // صلاحيات الإعدادات
  canViewSettings: false,
  canAddUser: false,
  canEditUser: false,
  canAddWarehouse: false,
  canBackup: false,
  
  // صلاحيات التقارير
  canViewReports: true,
  canViewAccountStatement: true,
  canViewSalesReport: true,
  canViewPurchasesReport: true,
  canViewDailyMatching: true,
};

export function AddBranchForm({ onBack }: AddBranchFormProps) {
  const { currentUser } = useAppStore();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    managerPhone: '',
    managerPassword: '',
    confirmPassword: '',
  });
  
  const [permissions, setPermissions] = useState(defaultPermissions);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setPermissions(prev => ({ ...prev, [permission]: checked }));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم الفرع');
      return;
    }
    if (!formData.address.trim()) {
      toast.error('يرجى إدخال عنوان الفرع');
      return;
    }
    if (!formData.managerPhone.trim()) {
      toast.error('يرجى إدخال رقم هاتف المدير');
      return;
    }
    if (!formData.managerPassword.trim()) {
      toast.error('يرجى إدخال كلمة المرور');
      return;
    }
    if (formData.managerPassword !== formData.confirmPassword) {
      toast.error('كلمة المرور غير متطابقة');
      return;
    }

    setSaving(true);
    try {
      // Create branch
      const branchRes = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
        }),
      });

      const branchData = await branchRes.json();

      if (!branchRes.ok) {
        throw new Error(branchData.message || 'فشل في إنشاء الفرع');
      }

      const branchId = branchData.branch?.id;

      if (!branchId) {
        throw new Error('لم يتم استلام معرف الفرع');
      }

      // Create manager user
      const userRes = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `مدير ${formData.name}`,
          phone: formData.managerPhone,
          password: formData.managerPassword,
          role: 'manager',
          branchId: branchId,
          permissions: permissions,
        }),
      });

      const userData = await userRes.json();

      if (!userRes.ok) {
        // إذا فشل إنشاء المستخدم، نحذف الفرع الذي تم إنشاؤه
        await fetch('/api/branches', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: branchId }),
        });
        throw new Error(userData.error || 'فشل في إنشاء مدير الفرع');
      }

      toast.success('تم إضافة الفرع والمدير بنجاح');
      onBack();
    } catch (error: any) {
      console.error('Error saving branch:', error);
      toast.error(error.message || 'حدث خطأ في حفظ الفرع');
    } finally {
      setSaving(false);
    }
  };

  const permissionGroups = [
    {
      title: 'صلاحيات البيع',
      items: [
        { key: 'canSale', label: 'البيع' },
        { key: 'canChangePrice', label: 'تغيير السعر' },
        { key: 'canCreditSale', label: 'البيع الآجل' },
        { key: 'canViewPurchasePrice', label: 'عرض سعر الشراء' },
        { key: 'canEditSaleInvoice', label: 'تعديل قائمة البيع' },
        { key: 'canDeleteSaleInvoice', label: 'حذف قائمة البيع' },
        { key: 'canEditSaleDate', label: 'تعديل تاريخ البيع' },
        { key: 'canGiveFreeWash', label: 'إعطاء غسل مجاني' },
        { key: 'canPartialPayment', label: 'الدفع الجزئي' },
      ]
    },
    {
      title: 'صلاحيات الشراء',
      items: [
        { key: 'canPurchase', label: 'الشراء' },
        { key: 'canEditPurchaseInvoice', label: 'تعديل قائمة الشراء' },
        { key: 'canDeletePurchaseInvoice', label: 'حذف قائمة الشراء' },
        { key: 'canPurchaseReturn', label: 'إرجاع الشراء' },
      ]
    },
    {
      title: 'صلاحيات المخازن',
      items: [
        { key: 'canViewMaterials', label: 'عرض المواد' },
        { key: 'canEditMaterial', label: 'تعديل المواد' },
        { key: 'canDeleteMaterial', label: 'حذف المواد' },
        { key: 'canAddMaterial', label: 'إضافة مواد' },
        { key: 'canWarehouseTransfer', label: 'النقل المخزني' },
        { key: 'canTransferBetweenBranches', label: 'النقل بين الفروع' },
        { key: 'canTransferBetweenWarehouses', label: 'النقل بين المخازن' },
        { key: 'canInventoryCount', label: 'الجرد المخزني' },
        { key: 'canInventoryAdjustment', label: 'التسوية المخزنية' },
      ]
    },
    {
      title: 'صلاحيات الحسابات',
      items: [
        { key: 'canViewAccounts', label: 'عرض الحسابات' },
        { key: 'canEditCustomer', label: 'تعديل الزبائن' },
        { key: 'canEditSupplier', label: 'تعديل الموردين' },
        { key: 'canPaymentVoucher', label: 'سند القبض' },
        { key: 'canPaymentDisbursement', label: 'سند الدفع' },
        { key: 'canExpense', label: 'المصروفات' },
      ]
    },
    {
      title: 'صلاحيات التقارير',
      items: [
        { key: 'canViewReports', label: 'عرض التقارير' },
        { key: 'canViewAccountStatement', label: 'الملخص الحسابي' },
        { key: 'canViewSalesReport', label: 'تقرير المبيعات' },
        { key: 'canViewPurchasesReport', label: 'تقرير المشتريات' },
        { key: 'canViewDailyMatching', label: 'المطابقة اليومية' },
      ]
    },
    {
      title: 'صلاحيات الإعدادات',
      items: [
        { key: 'canViewSettings', label: 'عرض الإعدادات' },
        { key: 'canAddUser', label: 'إضافة مستخدم' },
        { key: 'canEditUser', label: 'تعديل المستخدمين' },
        { key: 'canAddWarehouse', label: 'إضافة مخزن' },
        { key: 'canBackup', label: 'النسخ الاحتياطي' },
      ]
    },
  ];

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
            <h1 className="text-2xl font-bold">إضافة فرع جديد</h1>
            <p className="text-muted-foreground">إدخال بيانات الفرع والمدير</p>
          </div>
        </div>

        {/* Branch Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              بيانات الفرع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم الفرع *</Label>
                <div className="relative">
                  <Input
                    placeholder="مثال: فرع المنصور"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="pr-10"
                  />
                  <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>العنوان *</Label>
                <div className="relative">
                  <Input
                    placeholder="عنوان الفرع"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="pr-10"
                  />
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manager Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              بيانات مدير الفرع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رقم هاتف المدير *</Label>
                <div className="relative">
                  <Input
                    type="tel"
                    placeholder="رقم الهاتف"
                    value={formData.managerPhone}
                    onChange={(e) => handleInputChange('managerPhone', e.target.value)}
                    className="pr-10"
                  />
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>كلمة المرور *</Label>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="كلمة المرور"
                    value={formData.managerPassword}
                    onChange={(e) => handleInputChange('managerPassword', e.target.value)}
                    className="pr-10"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>تأكيد كلمة المرور *</Label>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="تأكيد كلمة المرور"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="pr-10"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              صلاحيات مدير الفرع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {permissionGroups.map((group) => (
                <div key={group.title} className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground border-b pb-2">
                    {group.title}
                  </h4>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <div key={item.key} className="flex items-center gap-2">
                        <Checkbox
                          id={item.key}
                          checked={permissions[item.key as keyof typeof permissions] as boolean}
                          onCheckedChange={(checked) => handlePermissionChange(item.key, checked as boolean)}
                        />
                        <label htmlFor={item.key} className="text-sm cursor-pointer">
                          {item.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 ml-2" />
            {saving ? 'جاري الحفظ...' : 'حفظ الفرع'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
