/* eslint-disable react-hooks/immutability */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Warehouse, Building, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Warehouse {
  id: string;
  name: string;
  branchId: string;
  branch?: { id: string; name: string };
  isDefault: boolean;
  _count?: { materials: number };
}

interface Branch {
  id: string;
  name: string;
  address?: string;
}

export function WarehousesList() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    branchId: '',
    isDefault: false
  });
  
  const fetchWarehouses = useCallback(async () => {
    try {
      const res = await fetch('/api/warehouses');
      const data = await res.json();
      setWarehouses(data.warehouses || []);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    }
  }, []);
  
  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch('/api/branches');
      const data = await res.json();
      setBranches(data.branches || []);
      
      // If no branches exist, create a default one
      if (!data.branches || data.branches.length === 0) {
        await fetch('/api/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'الفرع الرئيسي' })
        });
        fetchBranches();
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  }, []);
  
  useEffect(() => {
    fetchWarehouses();
    fetchBranches();
  }, [fetchWarehouses, fetchBranches]);
  
  const handleOpenDialog = (warehouse?: Warehouse) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        name: warehouse.name,
        branchId: warehouse.branchId,
        isDefault: warehouse.isDefault
      });
    } else {
      setEditingWarehouse(null);
      setFormData({
        name: '',
        branchId: branches[0]?.id || '',
        isDefault: false
      });
    }
    setShowDialog(true);
  };
  
  const handleSave = async () => {
    if (!formData.name || !formData.branchId) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    try {
      const url = '/api/warehouses';
      const method = editingWarehouse ? 'PUT' : 'POST';
      const body = editingWarehouse
        ? { id: editingWarehouse.id, ...formData }
        : formData;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const result = await res.json();
      
      if (result.success) {
        toast.success(editingWarehouse ? 'تم تحديث المخزن' : 'تم إضافة المخزن');
        setShowDialog(false);
        fetchWarehouses();
      } else {
        toast.error(result.message || 'حدث خطأ في الحفظ');
      }
    } catch (error) {
      toast.error('حدث خطأ في الحفظ');
    }
  };
  
  const handleDelete = async (id: string) => {
    const warehouse = warehouses.find(w => w.id === id);
    
    if (warehouse?._count?.materials && warehouse._count.materials > 0) {
      toast.error('لا يمكن حذف مخزن يحتوي على مواد');
      return;
    }
    
    if (!confirm('هل أنت متأكد من حذف هذا المخزن؟')) return;
    
    try {
      const res = await fetch('/api/warehouses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      const result = await res.json();
      
      if (result.success) {
        toast.success('تم حذف المخزن');
        fetchWarehouses();
      } else {
        toast.error(result.message || 'حدث خطأ في الحذف');
      }
    } catch (error) {
      toast.error('حدث خطأ في الحذف');
    }
  };
  
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">المخازن</h1>
          <p className="text-muted-foreground">إدارة المخازن والفروع</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة مخزن
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Warehouse className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المخازن</p>
              <p className="text-2xl font-bold">{warehouses.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Building className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الفروع</p>
              <p className="text-2xl font-bold">{branches.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Warehouse className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المخازن الافتراضية</p>
              <p className="text-2xl font-bold">{warehouses.filter(w => w.isDefault).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Warehouses Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المخازن</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>اسم المخزن</TableHead>
                  <TableHead>الفرع</TableHead>
                  <TableHead>عدد المواد</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="w-24">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.length > 0 ? (
                  warehouses.map((warehouse, index) => (
                    <TableRow key={warehouse.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Warehouse className="w-4 h-4 text-muted-foreground" />
                          {warehouse.name}
                        </div>
                      </TableCell>
                      <TableCell>{warehouse.branch?.name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {warehouse._count?.materials || 0} مادة
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {warehouse.isDefault && (
                          <Badge className="bg-amber-500">افتراضي</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(warehouse)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(warehouse.id)}
                            className="text-red-500"
                            disabled={warehouse._count?.materials !== undefined && warehouse._count.materials > 0}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Warehouse className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد مخازن</p>
                      <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                        إضافة مخزن جديد
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWarehouse ? 'تعديل المخزن' : 'إضافة مخزن جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>اسم المخزن *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: مخزن الوقود"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>الفرع *</Label>
              <Select value={formData.branchId} onValueChange={(v) => setFormData({ ...formData, branchId: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر الفرع" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="isDefault">المخزن الافتراضي</Label>
            </div>
            
            {formData.isDefault && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">سيتم تعيين هذا المخزن كافتراضي بدلاً من المخزن الافتراضي الحالي</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={!formData.name || !formData.branchId}>
              {editingWarehouse ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
