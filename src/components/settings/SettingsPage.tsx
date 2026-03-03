'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Settings,
  Database,
  Plus,
  Edit,
  Moon,
  Sun,
  Download,
  Upload,
  Building2,
  Trash2,
  User,
  Key,
  Save
} from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface User {
  id: string;
  name: string;
  phone?: string;
  role: string;
  permissions?: any;
  branchId?: string;
  branch?: { id: string; name: string };
  active: boolean;
}

interface Branch {
  id: string;
  name: string;
  address?: string;
}

const allPermissions = [
  { id: 'canSale', label: 'إجراء المبيعات' },
  { id: 'canPurchase', label: 'إجراء المشتريات' },
  { id: 'canChangePrice', label: 'تعديل الأسعار' },
  { id: 'canCreditSale', label: 'البيع الآجل' },
  { id: 'canViewPurchasePrice', label: 'عرض سعر الشراء' },
  { id: 'canEditSaleInvoice', label: 'تعديل فاتورة البيع' },
  { id: 'canDeleteSaleInvoice', label: 'حذف فاتورة البيع' },
  { id: 'canEditSaleDate', label: 'تعديل تاريخ البيع' },
  { id: 'canGiveFreeWash', label: 'إعطاء غسيل مجاني' },
  { id: 'canPartialPayment', label: 'السداد الجزئي' },
  { id: 'canEditPurchaseInvoice', label: 'تعديل فاتورة الشراء' },
  { id: 'canDeletePurchaseInvoice', label: 'حذف فاتورة الشراء' },
  { id: 'canPurchaseReturn', label: 'إرجاع المشتريات' },
  { id: 'canViewMaterials', label: 'عرض المواد' },
  { id: 'canAddMaterial', label: 'إضافة مادة' },
  { id: 'canEditMaterial', label: 'تعديل مادة' },
  { id: 'canDeleteMaterial', label: 'حذف مادة' },
  { id: 'canWarehouseTransfer', label: 'النقل المخزني' },
  { id: 'canInventoryCount', label: 'الجرد المخزني' },
  { id: 'canInventoryAdjustment', label: 'التسوية المخزنية' },
  { id: 'canViewAccounts', label: 'عرض الحسابات' },
  { id: 'canEditCustomer', label: 'تعديل العملاء' },
  { id: 'canPaymentVoucher', label: 'سندات القبض' },
  { id: 'canPaymentDisbursement', label: 'سندات الصرف' },
  { id: 'canViewSettings', label: 'عرض الإعدادات' },
  { id: 'canAddUser', label: 'إضافة مستخدم' },
  { id: 'canEditUser', label: 'تعديل مستخدم' },
  { id: 'canBackup', label: 'النسخ الاحتياطي' },
  { id: 'canViewReports', label: 'عرض التقارير' },
];

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { currentUser, login } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);

  // حالة تعديل الملف الشخصي
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);

  const [userForm, setUserForm] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'cashier',
    branchId: '',
    permissions: {} as Record<string, boolean>,
  });

  // تجنب مشكلة hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  // تحديث نموذج الملف الشخصي عند تغيير المستخدم
  useEffect(() => {
    if (currentUser) {
      setProfileForm(prev => ({
        ...prev,
        name: currentUser.name || '',
        phone: currentUser.phone || ''
      }));
    }
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, branchesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/branches')
      ]);
      
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data);
      }
      
      if (branchesRes.ok) {
        const data = await branchesRes.json();
        setBranches(data.branches || data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddUserDialog = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      phone: '',
      password: '',
      role: 'cashier',
      branchId: branches[0]?.id || '',
      permissions: {},
    });
    setShowUserDialog(true);
  };

  const openEditUserDialog = (user: User) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      phone: user.phone || '',
      password: '',
      role: user.role,
      branchId: user.branchId || '',
      permissions: user.permissions || {},
    });
    setShowUserDialog(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.name.trim()) {
      toast.error('يرجى إدخال اسم المستخدم');
      return;
    }

    if (!editingUser && !userForm.password) {
      toast.error('يرجى إدخال كلمة المرور');
      return;
    }

    if (!userForm.branchId) {
      toast.error('يرجى اختيار الفرع');
      return;
    }

    setSaving(true);
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });

      if (res.ok) {
        toast.success(editingUser ? 'تم تحديث المستخدم' : 'تم إضافة المستخدم');
        setShowUserDialog(false);
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (permId: string) => {
    setUserForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permId]: !prev.permissions[permId],
      },
    }));
  };

  // حفظ الملف الشخصي
  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) {
      toast.error('يرجى إدخال الاسم');
      return;
    }

    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      toast.error('كلمة المرور الجديدة غير متطابقة');
      return;
    }

    if (profileForm.newPassword && !profileForm.currentPassword) {
      toast.error('يرجى إدخال كلمة المرور الحالية');
      return;
    }

    setProfileSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          name: profileForm.name,
          phone: profileForm.phone,
          currentPassword: profileForm.currentPassword || undefined,
          newPassword: profileForm.newPassword || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        // تحديث بيانات المستخدم في الـ store
        login({
          ...currentUser,
          name: data.user.name,
          phone: data.user.phone
        });
        toast.success('تم حفظ التغييرات بنجاح');
        setProfileForm(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        const error = await res.json();
        toast.error(error.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch (error) {
      console.error('Save profile error:', error);
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setProfileSaving(false);
    }
  };

  // حذف مستخدم
  const handleDeleteUser = async (user: User) => {
    // منع حذف المدير الوحيد
    if (user.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        toast.error('لا يمكن حذف المدير الوحيد في النظام');
        return;
      }
    }

    if (!confirm(`هل أنت متأكد من حذف المستخدم "${user.name}"؟\n\nتحذير: سيتم حذف جميع البيانات المرتبطة بهذا المستخدم.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('تم حذف المستخدم بنجاح');
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'حدث خطأ أثناء الحذف');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  // النسخ الاحتياطي - تنزيل
  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch('/api/backup');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aldiaa-backup-${new Date().toISOString().split('T')[0]}.db`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('تم تنزيل النسخة الاحتياطية بنجاح');
      } else {
        const error = await res.json();
        toast.error(error.error || 'حدث خطأ أثناء النسخ الاحتياطي');
      }
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('حدث خطأ أثناء النسخ الاحتياطي');
    } finally {
      setBackupLoading(false);
    }
  };

  // استعادة النسخة الاحتياطية
  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.db')) {
      toast.error('يرجى اختيار ملف قاعدة بيانات (.db)');
      return;
    }

    if (!confirm('تحذير: سيتم استبدال جميع البيانات الحالية. هل أنت متأكد؟')) {
      return;
    }

    setBackupLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/backup', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success('تم استعادة النسخة الاحتياطية بنجاح. سيتم إعادة تحميل الصفحة.');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(data.error || 'حدث خطأ أثناء الاستعادة');
      }
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('حدث خطأ أثناء الاستعادة');
    } finally {
      setBackupLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الإعدادات</h1>
            <p className="text-muted-foreground">إدارة النظام والمستخدمين</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
            <TabsTrigger value="users">المستخدمين</TabsTrigger>
            <TabsTrigger value="appearance">المظهر</TabsTrigger>
            <TabsTrigger value="backup">النسخ الاحتياطي</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  الملف الشخصي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* معلومات المستخدم */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {currentUser?.name?.charAt(0) || 'م'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{currentUser?.name || 'المستخدم'}</h3>
                    <p className="text-muted-foreground">
                      {currentUser?.role === 'admin' ? 'مدير النظام' : 'موظف'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentUser?.phone || 'لا يوجد رقم هاتف'}
                    </p>
                  </div>
                </div>

                {/* نموذج التعديل */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      معلومات الحساب
                    </h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>الاسم</Label>
                        <Input
                          value={profileForm.name}
                          onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                          placeholder="اسم المستخدم"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>رقم الهاتف</Label>
                        <Input
                          value={profileForm.phone}
                          onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                          placeholder="رقم الهاتف"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      تغيير كلمة المرور
                    </h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>كلمة المرور الحالية</Label>
                        <Input
                          type="password"
                          value={profileForm.currentPassword}
                          onChange={e => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                          placeholder="كلمة المرور الحالية"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>كلمة المرور الجديدة</Label>
                        <Input
                          type="password"
                          value={profileForm.newPassword}
                          onChange={e => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                          placeholder="كلمة المرور الجديدة"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>تأكيد كلمة المرور</Label>
                        <Input
                          type="password"
                          value={profileForm.confirmPassword}
                          onChange={e => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                          placeholder="تأكيد كلمة المرور الجديدة"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={profileSaving}>
                    <Save className="w-4 h-4 ml-2" />
                    {profileSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>المستخدمون</CardTitle>
                <Button onClick={openAddUserDialog}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة مستخدم
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">الاسم</TableHead>
                          <TableHead className="text-right">الهاتف</TableHead>
                          <TableHead className="text-right">الدور</TableHead>
                          <TableHead className="text-right">الفرع</TableHead>
                          <TableHead className="text-right">الحالة</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map(user => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.phone || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                {user.role === 'admin' ? 'مدير' : 'كاشير'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                <span>{user.branch?.name || '-'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.active ? 'default' : 'destructive'}>
                                {user.active ? 'نشط' : 'معطل'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditUserDialog(user)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteUser(user)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
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
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="w-5 h-5" />
                  المظهر
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">الوضع الداكن</Label>
                    <p className="text-sm text-muted-foreground">
                      تفعيل الوضع الداكن للواجهة لتقليل إجهاد العين
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sun className={`w-5 h-5 ${theme === 'light' ? 'text-amber-500' : 'text-muted-foreground'}`} />
                    <Switch
                      checked={theme === 'dark'}
                      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    />
                    <Moon className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-muted-foreground'}`} />
                  </div>
                </div>

                {/* معاينة الألوان */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className={`${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white'}`}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="font-bold">معاينة الوضع {theme === 'dark' ? 'الداكن' : 'الفاتح'}</div>
                        <div className="text-sm text-muted-foreground">
                          هذا كيف ستبدو العناصر في الوضع {theme === 'dark' ? 'الداكن' : 'الفاتح'}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge>تسمية</Badge>
                          <Badge variant="secondary">ثانوي</Badge>
                          <Badge variant="destructive">تحذير</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="font-medium">ألوان إضافية</div>
                        <div className="grid grid-cols-4 gap-2">
                          <div className="h-8 rounded bg-primary"></div>
                          <div className="h-8 rounded bg-secondary"></div>
                          <div className="h-8 rounded bg-accent"></div>
                          <div className="h-8 rounded bg-muted"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup Tab */}
          <TabsContent value="backup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  النسخ الاحتياطي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* تنزيل نسخة احتياطية */}
                  <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Download className="w-8 h-8 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">تصدير البيانات</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        تنزيل نسخة احتياطية كاملة من قاعدة البيانات
                        <br />
                        <span className="text-xs">(المبيعات، المشتريات، المخزون، الحسابات)</span>
                      </p>
                      <Button 
                        onClick={handleBackup} 
                        className="w-full"
                        disabled={backupLoading}
                      >
                        <Download className="w-4 h-4 ml-2" />
                        {backupLoading ? 'جاري التنزيل...' : 'تنزيل النسخة الاحتياطية'}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* استعادة نسخة احتياطية */}
                  <Card className="border-dashed border-2 hover:border-orange-500/50 transition-colors">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <Upload className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">استيراد البيانات</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        استعادة نسخة احتياطية سابقة
                        <br />
                        <span className="text-xs text-red-500">(تحذير: سيتم استبدال جميع البيانات)</span>
                      </p>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".db"
                          onChange={handleRestore}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={backupLoading}
                        />
                        <Button variant="outline" className="w-full" disabled={backupLoading}>
                          <Upload className="w-4 h-4 ml-2" />
                          {backupLoading ? 'جاري الاستعادة...' : 'استعادة النسخة الاحتياطية'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* معلومات إضافية */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">💡 نصائح للنسخ الاحتياطي</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                    <li>احتفظ بنسخ احتياطية متعددة في أماكن مختلفة</li>
                    <li>قم بالنسخ الاحتياطي بشكل دوري (يومياً أو أسبوعياً)</li>
                    <li>قبل الاستعادة، تأكد من أن الملف من مصدر موثوق</li>
                    <li>يُنصح بتنزيل نسخة احتياطية قبل إجراء تغييرات كبيرة</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Dialog */}
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم *</Label>
                  <Input
                    value={userForm.name}
                    onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="اسم المستخدم"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الهاتف</Label>
                  <Input
                    value={userForm.phone}
                    onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
                    placeholder="رقم الهاتف"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>كلمة المرور {editingUser ? '(اتركها فارغة للإبقاء)' : '*'}</Label>
                  <Input
                    type="password"
                    value={userForm.password}
                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="كلمة المرور"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الدور</Label>
                  <select
                    value={userForm.role}
                    onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="cashier">كاشير</option>
                    <option value="admin">مدير</option>
                  </select>
                </div>
              </div>
              
              {/* حقل الفرع */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  الفرع *
                </Label>
                <Select 
                  value={userForm.branchId} 
                  onValueChange={(v) => setUserForm({ ...userForm, branchId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                        {branch.address && ` - ${branch.address}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  سيتم ربط الموظف بهذا الفرع وسيظهر في تقاريره
                </p>
              </div>

              {/* Permissions */}
              {userForm.role !== 'admin' && (
                <div className="space-y-2">
                  <Label>الصلاحيات</Label>
                  <div className="grid grid-cols-2 gap-2 p-4 border rounded-lg max-h-60 overflow-auto">
                    {allPermissions.map(perm => (
                      <div key={perm.id} className="flex items-center gap-2">
                        <Checkbox
                          id={perm.id}
                          checked={!!userForm.permissions[perm.id]}
                          onCheckedChange={() => togglePermission(perm.id)}
                        />
                        <label htmlFor={perm.id} className="text-sm cursor-pointer">
                          {perm.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSaveUser} disabled={saving}>
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
